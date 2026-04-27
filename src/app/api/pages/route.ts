import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pages, pageTags } from '@/db/schema';
import { eq, desc, and, inArray, count, SQL } from 'drizzle-orm';
import { uniqueSlug } from '@/lib/slugify';
import { isPageStatus, isPageType } from '@/lib/pages';
import { createPageSchema, validateBody } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const collectionId = searchParams.get('collection_id');
    const type = searchParams.get('type');

    if (status && !isPageStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (type && !isPageType(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const session = await auth();
    const conditions: SQL[] = [];
    if (session) {
      if (status) conditions.push(eq(pages.status, status));
    } else {
      conditions.push(eq(pages.status, 'published'));
    }
    if (collectionId) conditions.push(eq(pages.collectionId, collectionId));
    if (type) conditions.push(eq(pages.type, type));

    // Pagination
    const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10);
    const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
    const pageLimit = Math.max(1, Math.min(isNaN(rawLimit) ? 50 : rawLimit, 100));
    const pageOffset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(pages)
      .where(where)
      .orderBy(desc(pages.updatedAt))
      .limit(pageLimit)
      .offset(pageOffset);

    // Fetch tags only for returned pages (filtered at DB level)
    const pageIds = rows.map((r) => r.id);
    const allTags =
      pageIds.length > 0
        ? await db
            .select()
            .from(pageTags)
            .where(inArray(pageTags.pageId, pageIds))
        : [];

    const tagsByPage = new Map<string, string[]>();
    for (const t of allTags) {
      const arr = tagsByPage.get(t.pageId) || [];
      arr.push(t.tag);
      tagsByPage.set(t.pageId, arr);
    }

    const result = rows.map((page) => ({
      ...page,
      tags: tagsByPage.get(page.id) || [],
    }));

    // Pagination metadata
    const [{ total }] = await db
      .select({ total: count() })
      .from(pages)
      .where(where);

    return NextResponse.json({
      data: result,
      pagination: {
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + result.length < total,
      },
    });
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
    const v = validateBody(createPageSchema, body);
    if (!v.success) return v.response;
    const { title, mdx_source, summary, type, collection_id, tags } = v.data;

    const slug = await uniqueSlug(title);

    const [created] = await db
      .insert(pages)
      .values({
        title,
        slug,
        mdxSource: mdx_source,
        summary: summary || null,
        type,
        collectionId: collection_id || null,
        status: 'draft',
      })
      .returning();

    // Insert tags if provided
    if (tags && tags.length > 0) {
      await db.insert(pageTags).values(
        tags.map((tag: string) => ({ pageId: created.id, tag }))
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    // Catch unique constraint violation (slug race condition)
    if (
      error instanceof Error &&
      (error.message.includes('unique constraint') ||
        error.message.includes('duplicate key') ||
        error.message.includes('UNIQUE constraint failed'))
    ) {
      return NextResponse.json(
        { error: 'A page with this slug already exists. Please try again.' },
        { status: 409 }
      );
    }
    console.error('POST /api/pages error:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
