import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/rag/search';
import { db } from '@/db';
import { pages, collections } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  // Return early for empty queries without consuming rate limit
  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const rateCheck = checkRateLimit(req, 60, 60_000);
  if (!rateCheck.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(rateCheck.retryAfter) },
    });
  }

  try {
    const chunks = await hybridSearch(q, { scopeType: 'site' });

    if (chunks.length === 0) {
      return NextResponse.json([]);
    }

    const pageIds = [...new Set(chunks.map((c) => c.pageId))];

    const pageRows = await db
      .select({
        id: pages.id,
        type: pages.type,
        title: pages.title,
        slug: pages.slug,
        summary: pages.summary,
        status: pages.status,
        collectionId: pages.collectionId,
      })
      .from(pages)
      .where(inArray(pages.id, pageIds));

    const publishedPages = new Map(
      pageRows
        .filter((p) => p.status === 'published')
        .map((p) => [p.id, p])
    );

    const collectionIds = [
      ...new Set(
        [...publishedPages.values()]
          .map((p) => p.collectionId)
          .filter((id): id is string => id !== null)
      ),
    ];

    const collectionMap = new Map<string, string>();
    if (collectionIds.length > 0) {
      const cols = await db
        .select({ id: collections.id, name: collections.name })
        .from(collections)
        .where(inArray(collections.id, collectionIds));
      for (const c of cols) {
        collectionMap.set(c.id, c.name);
      }
    }

    const deduped = new Map<
      string,
      {
        type: string;
        title: string;
        slug: string;
        collection: string | undefined;
        summary: string | null;
        snippet: string;
        score: number;
        anchorId: string | null;
      }
    >();

    for (const chunk of chunks) {
      const page = publishedPages.get(chunk.pageId);
      if (!page) continue;

      if (!deduped.has(chunk.pageId) || chunk.score > deduped.get(chunk.pageId)!.score) {
        deduped.set(chunk.pageId, {
          type: page.type,
          title: page.title,
          slug: page.slug,
          collection: page.collectionId ? collectionMap.get(page.collectionId) : undefined,
          summary: page.summary,
          snippet: chunk.content.slice(0, 200),
          score: chunk.score,
          anchorId: chunk.anchorId,
        });
      }
    }

    return NextResponse.json([...deduped.values()]);
  } catch (err) {
    console.error('[search] GET /api/search failed:', err);
    return NextResponse.json(
      { error: 'Search failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
