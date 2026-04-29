import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chunks, chunkEmbeddings } from '@/db/schema';
import { count, countDistinct } from 'drizzle-orm';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

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
