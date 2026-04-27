import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brainstack.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/editor', '/api', '/setup', '/login', '/settings'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
