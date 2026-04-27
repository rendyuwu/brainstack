import { NextResponse } from 'next/server';
import { db } from '@/db';
import { collections } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: collections.id,
        name: collections.name,
        slug: collections.slug,
        description: collections.description,
        icon: collections.icon,
        color: collections.color,
        sortOrder: collections.sortOrder,
        createdAt: collections.createdAt,
      })
      .from(collections)
      .orderBy(asc(collections.sortOrder));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/collections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
