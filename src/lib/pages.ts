import { db } from '@/db';
import { pages, collections, pageTags } from '@/db/schema';
import { eq, desc, and, ilike, or, inArray } from 'drizzle-orm';

export const PAGE_STATUSES = ['draft', 'published', 'archived'] as const;
export const PAGE_TYPES = ['tutorial', 'tip', 'cheatsheet', 'note'] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];
export type PageType = (typeof PAGE_TYPES)[number];

export function isPageStatus(value: unknown): value is PageStatus {
  return typeof value === 'string' && PAGE_STATUSES.includes(value as PageStatus);
}

export function isPageType(value: unknown): value is PageType {
  return typeof value === 'string' && PAGE_TYPES.includes(value as PageType);
}

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
    .where(and(eq(pages.slug, slug), eq(pages.status, 'published')))
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

  if (allCollections.length === 0) return [];

  const collectionIds = allCollections.map((c) => c.id);

  // Single query for all published pages across all collections
  const allPages = await db
    .select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      collectionId: pages.collectionId,
      publishedAt: pages.publishedAt,
    })
    .from(pages)
    .where(
      and(
        inArray(pages.collectionId, collectionIds),
        eq(pages.status, 'published')
      )
    )
    .orderBy(desc(pages.publishedAt));

  // Group pages by collection in JS
  const pagesByCollection = new Map<string, typeof allPages>();
  for (const page of allPages) {
    if (!page.collectionId) continue;
    const arr = pagesByCollection.get(page.collectionId) || [];
    arr.push(page);
    pagesByCollection.set(page.collectionId, arr);
  }

  return allCollections.map((col) => ({
    ...col,
    pages: (pagesByCollection.get(col.id) || []).map(({ id, title, slug }) => ({
      id,
      title,
      slug,
    })),
  }));
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
    .from(pageTags)
    .innerJoin(pages, eq(pageTags.pageId, pages.id))
    .where(eq(pages.status, 'published'));
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
