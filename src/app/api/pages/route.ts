import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pages, pageTags } from '@/db/schema';
import { eq, desc, and, SQL } from 'drizzle-orm';
import { uniqueSlug } from '@/lib/slugify';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const collectionId = searchParams.get('collection_id');
    const type = searchParams.get('type');

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(pages.status, status));
    if (collectionId) conditions.push(eq(pages.collectionId, collectionId));
    if (type) conditions.push(eq(pages.type, type));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(pages)
      .where(where)
      .orderBy(desc(pages.updatedAt));

    // Fetch tags for each page
    const pageIds = rows.map((r) => r.id);
    const allTags =
      pageIds.length > 0
        ? await db.select().from(pageTags)
        : [];

    const tagsByPage = new Map<string, string[]>();
    for (const t of allTags) {
      if (!pageIds.includes(t.pageId)) continue;
      const arr = tagsByPage.get(t.pageId) || [];
      arr.push(t.tag);
      tagsByPage.set(t.pageId, arr);
    }

    const result = rows.map((page) => ({
      ...page,
      tags: tagsByPage.get(page.id) || [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/pages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, mdx_source, summary, type, collection_id, tags } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(title);

    const [created] = await db
      .insert(pages)
      .values({
        title,
        slug,
        mdxSource: mdx_source || '',
        summary: summary || null,
        type: type || 'tutorial',
        collectionId: collection_id || null,
        status: 'draft',
      })
      .returning();

    // Insert tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await db.insert(pageTags).values(
        tags.map((tag: string) => ({ pageId: created.id, tag }))
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/pages error:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
