import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { chunks, chunkEmbeddings } from '@/db/schema';
import { count, countDistinct } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [totalResult] = await db.select({ n: count() }).from(chunks);
    const [embeddedResult] = await db
      .select({ n: countDistinct(chunkEmbeddings.chunkId) })
      .from(chunkEmbeddings);

    return NextResponse.json({
      totalChunks: totalResult.n,
      embeddedChunks: embeddedResult.n,
    });
  } catch (error) {
    console.error('GET /api/admin/embeddings/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embedding stats' },
      { status: 500 },
    );
  }
}
