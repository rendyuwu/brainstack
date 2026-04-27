import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pageRelations, pages } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { createRelationSchema, deleteRelationSchema, validateBody } from '@/lib/validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .where(
        or(
          eq(pageRelations.sourcePageId, id),
          eq(pageRelations.targetPageId, id)
        )
      );

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await request.json();
    const v = validateBody(deleteRelationSchema, body);
    if (!v.success) return v.response;
    const { relationId } = v.data;

    const [deleted] = await db
      .delete(pageRelations)
      .where(eq(pageRelations.id, relationId))
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
