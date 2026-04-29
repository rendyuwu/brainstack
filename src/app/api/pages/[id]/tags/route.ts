import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { db } from '@/db';
import { pageTags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateTagsSchema, validateBody } from '@/lib/validation';
import { isValidUUID } from '@/lib/uuid';

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
    const v = validateBody(updateTagsSchema, body);
    if (!v.success) return v.response;
    const { tags } = v.data;

    // Atomic: delete + insert in a transaction
    await db.transaction(async (tx) => {
      await tx.delete(pageTags).where(eq(pageTags.pageId, id));

      if (tags.length > 0) {
        await tx.insert(pageTags).values(
          tags.map((tag: string) => ({ pageId: id, tag }))
        );
      }
    });

    return NextResponse.json({ pageId: id, tags });
  } catch (error) {
    console.error('PUT /api/pages/[id]/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tags' },
      { status: 500 }
    );
  }
}
