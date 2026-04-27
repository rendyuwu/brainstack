import type { MetadataRoute } from 'next';
import { getPublishedPages, getCollections } from '@/lib/pages';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brainstack.dev';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/cheatsheets`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/ask`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  try {
    const [publishedPages, collections] = await Promise.all([
      getPublishedPages(),
      getCollections(),
    ]);

    const blogPages: MetadataRoute.Sitemap = publishedPages
      .filter((p) => p.type !== 'cheatsheet')
      .map((page) => ({
        url: `${BASE_URL}/blog/${page.slug}`,
        lastModified: page.updatedAt ?? page.publishedAt ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const cheatsheetPages: MetadataRoute.Sitemap = publishedPages
      .filter((p) => p.type === 'cheatsheet')
      .map((page) => ({
        url: `${BASE_URL}/cheatsheets/${page.slug}`,
        lastModified: page.updatedAt ?? page.publishedAt ?? new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    const stackPages: MetadataRoute.Sitemap = [];
    for (const col of collections) {
      for (const page of col.pages) {
        const fullPage = publishedPages.find((p) => p.id === page.id);
        stackPages.push({
          url: `${BASE_URL}/stack/${col.slug}/${page.slug}`,
          lastModified: fullPage?.updatedAt ?? fullPage?.publishedAt ?? new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      }
    }

    return [...staticPages, ...blogPages, ...cheatsheetPages, ...stackPages];
  } catch {
    // DB may not be available at build time
    return staticPages;
  }
}
