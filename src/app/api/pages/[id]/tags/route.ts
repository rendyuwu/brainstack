import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pageTags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'tags must be an array of strings' },
        { status: 400 }
      );
    }

    // Delete existing tags
    await db.delete(pageTags).where(eq(pageTags.pageId, id));

    // Insert new tags
    if (tags.length > 0) {
      await db.insert(pageTags).values(
        tags.map((tag: string) => ({ pageId: id, tag }))
      );
    }

    return NextResponse.json({ pageId: id, tags });
  } catch (error) {
    console.error('PUT /api/pages/[id]/tags error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tags' },
      { status: 500 }
    );
  }
}
