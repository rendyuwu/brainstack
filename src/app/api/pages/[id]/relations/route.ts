import { NextRequest, NextResponse } from 'next/server';
import { auth, requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { pageRelations, pages } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { createRelationSchema, deleteRelationSchema, validateBody } from '@/lib/validation';
import { isValidUUID } from '@/lib/uuid';

// §V.34: relations GET is public (read-only)
// §V.6: only published pages visible to unauthenticated users
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const session = await auth();
    const isAdmin =
      (session?.user as { role?: string } | undefined)?.role === 'admin';

    // §V.6: non-admin cannot access relations for unpublished pages
    if (!isAdmin) {
      const [page] = await db
        .select({ status: pages.status })
        .from(pages)
        .where(eq(pages.id, id))
        .limit(1);

      if (page?.status !== 'published') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    const baseCondition = or(
      eq(pageRelations.sourcePageId, id),
      eq(pageRelations.targetPageId, id)
    );

    // Non-admin/public users only see relations to published pages
    const whereCondition = isAdmin
      ? baseCondition
      : and(baseCondition, eq(pages.status, 'published'));

    const relations = await db
      .select({
        relationId: pageRelations.id,
        sourcePageId: pageRelations.sourcePageId,
        targetPageId: pageRelations.targetPageId,
        relationType: pageRelations.relationType,
        pageId: pages.id,
        title: pages.title,
        slug: pages.slug,
        type: pages.type,
        status: pages.status,
      })
      .from(pageRelations)
      .innerJoin(
        pages,
        or(
          and(
            eq(pageRelations.sourcePageId, id),
            eq(pages.id, pageRelations.targetPageId)
          ),
          and(
            eq(pageRelations.targetPageId, id),
            eq(pages.id, pageRelations.sourcePageId)
          )
        )
      )
      .where(whereCondition);

    return NextResponse.json(relations);
  } catch (error) {
    console.error('GET /api/pages/[id]/relations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relations' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const v = validateBody(createRelationSchema, body);
    if (!v.success) return v.response;
    const { targetPageId, relationType } = v.data;

    if (id === targetPageId) {
      return NextResponse.json(
        { error: 'Cannot create a relation to the same page' },
        { status: 400 }
      );
    }

    const [relation] = await db
      .insert(pageRelations)
      .values({
        sourcePageId: id,
        targetPageId,
        relationType,
      })
      .returning();

    return NextResponse.json(relation, { status: 201 });
  } catch (error) {
    console.error('POST /api/pages/[id]/relations error:', error);
    return NextResponse.json(
      { error: 'Failed to create relation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const v = validateBody(deleteRelationSchema, body);
    if (!v.success) return v.response;
    const { relationId } = v.data;

    const [deleted] = await db
      .delete(pageRelations)
      .where(
        and(
          eq(pageRelations.id, relationId),
          or(
            eq(pageRelations.sourcePageId, id),
            eq(pageRelations.targetPageId, id)
          )
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Relation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deleted);
  } catch (error) {
    console.error('DELETE /api/pages/[id]/relations error:', error);
    return NextResponse.json(
      { error: 'Failed to delete relation' },
      { status: 500 }
    );
  }
}
