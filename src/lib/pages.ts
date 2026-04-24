import { db } from '@/db';
import { pages, collections, pageTags } from '@/db/schema';
import { eq, desc, and, ilike, or } from 'drizzle-orm';

export async function getPublishedPages() {
  return db
    .select()
    .from(pages)
    .where(eq(pages.status, 'published'))
    .orderBy(desc(pages.publishedAt));
}

export async function getPageBySlug(slug: string) {
  const result = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getPagesByCollection(collectionSlug: string) {
  const col = await getCollectionBySlug(collectionSlug);
  if (!col) return [];
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.collectionId, col.id), eq(pages.status, 'published')))
    .orderBy(desc(pages.publishedAt));
}

export async function getCollections() {
  const allCollections = await db
    .select()
    .from(collections)
    .orderBy(collections.sortOrder);

  const result = [];
  for (const col of allCollections) {
    const colPages = await db
      .select({ id: pages.id, title: pages.title, slug: pages.slug })
      .from(pages)
      .where(and(eq(pages.collectionId, col.id), eq(pages.status, 'published')))
      .orderBy(desc(pages.publishedAt));

    result.push({
      ...col,
      pages: colPages,
    });
  }
  return result;
}

export async function getCollectionBySlug(slug: string) {
  const result = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getPageTags(pageId: string) {
  const result = await db
    .select({ tag: pageTags.tag })
    .from(pageTags)
    .where(eq(pageTags.pageId, pageId));
  return result.map((r) => r.tag);
}

export async function getAllTags() {
  const result = await db
    .select({ tag: pageTags.tag })
    .from(pageTags);
  const unique = [...new Set(result.map((r) => r.tag))];
  return unique.sort();
}

export async function searchPages(query: string) {
  if (!query.trim()) return [];
  const pattern = `%${query}%`;
  return db
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      type: pages.type,
      summary: pages.summary,
      collectionId: pages.collectionId,
    })
    .from(pages)
    .where(
      and(
        eq(pages.status, 'published'),
        or(ilike(pages.title, pattern), ilike(pages.summary, pattern))
      )
    )
    .limit(20);
}

export async function getPageWithCollection(slug: string) {
  const page = await getPageBySlug(slug);
  if (!page) return null;

  let collection = null;
  if (page.collectionId) {
    const colResult = await db
      .select()
      .from(collections)
      .where(eq(collections.id, page.collectionId))
      .limit(1);
    collection = colResult[0] ?? null;
  }

  const tags = await getPageTags(page.id);

  return { ...page, collection, tags };
}
