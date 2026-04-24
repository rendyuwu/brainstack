import { NextRequest, NextResponse } from 'next/server';
import { searchPages } from '@/lib/pages';
import { db } from '@/db';
import { collections } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const results = await searchPages(q);

  const enriched = await Promise.all(
    results.map(async (page) => {
      let collectionName: string | undefined;
      if (page.collectionId) {
        const col = await db
          .select({ name: collections.name })
          .from(collections)
          .where(eq(collections.id, page.collectionId))
          .limit(1);
        collectionName = col[0]?.name;
      }
      return {
        type: page.type,
        title: page.title,
        slug: page.slug,
        collection: collectionName,
      };
    })
  );

  return NextResponse.json(enriched);
}
