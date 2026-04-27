import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { pages, pageRevisions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { runPublishPipeline } from '@/lib/rag/pipeline';
import { detectDuplicates } from '@/lib/rag/duplicate-detector';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // §V.33: write API requires admin role
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    // Get the current page
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update page status to published
    const [published] = await db
      .update(pages)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(pages.id, id))
      .returning();

    // Create a page revision with current mdx_source
    const [revision] = await db.insert(pageRevisions).values({
      pageId: id,
      mdxSource: page.mdxSource || '',
      plainText: (page.mdxSource || '').replace(/[#*`_~\[\]()>-]/g, '').trim(),
    }).returning({ id: pageRevisions.id });

    // Run publish pipeline (chunk + embed for RAG) — fire and forget
    // Log failures so they're visible; update page timestamp on success
    runPublishPipeline(id, revision.id, page.mdxSource || '')
      .then(() => {
        console.info(`[publish-pipeline] Completed for page ${id}`);
      })
      .catch((err) => {
        console.error(
          `[publish-pipeline] Failed for page ${id}, revision ${revision.id}:`,
          err instanceof Error ? err.message : err
        );
      });

    const duplicates = await detectDuplicates(id, page.title, page.mdxSource ?? '');

    return NextResponse.json({
      ...published,
      warnings: duplicates.length > 0
        ? [{ type: 'potential_duplicates', matches: duplicates }]
        : [],
    });
  } catch (error) {
    console.error('POST /api/pages/[id]/publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish page' },
      { status: 500 }
    );
  }
}
