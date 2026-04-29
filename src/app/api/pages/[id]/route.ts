import { NextRequest, NextResponse } from 'next/server';
import { auth, requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { pages, pageTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updatePageSchema, validateBody } from '@/lib/validation';
import { isValidUUID } from '@/lib/uuid';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);

    const session = await auth();
    if (!page || (!session && page.status !== 'published')) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const tags = await db
      .select({ tag: pageTags.tag })
      .from(pageTags)
      .where(eq(pageTags.pageId, id));

    return NextResponse.json({
      ...page,
      tags: tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error('GET /api/pages/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // §V.33: write API requires admin role
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await request.json();
    const v = validateBody(updatePageSchema, body);
    if (!v.success) return v.response;
    const { title, mdx_source, summary, type, collection_id } = v.data;

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = title;
    if (mdx_source !== undefined) updates.mdxSource = mdx_source;
    if (summary !== undefined) updates.summary = summary;
    if (type !== undefined) updates.type = type;
    if (collection_id !== undefined) updates.collectionId = collection_id;

    const [updated] = await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/pages/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // §V.33: write API requires admin role
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const [archived] = await db
      .update(pages)
      .set({ status: 'archived', updatedAt: new Date().toISOString() })
      .where(eq(pages.id, id))
      .returning();

    if (!archived) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(archived);
  } catch (error) {
    console.error('DELETE /api/pages/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to archive page' },
      { status: 500 }
    );
  }
}
