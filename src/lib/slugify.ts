import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function toSlug(title: string): string {
  let slug = title
    .normalize('NFKD')
    // Remove combining diacritical marks (accents)
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    // Keep word chars, unicode letters/numbers, spaces, hyphens
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Fallback for empty slugs (e.g., emoji-only titles)
  if (!slug) slug = 'untitled';

  return slug;
}

const MAX_SLUG_ATTEMPTS = 100;

export async function uniqueSlug(title: string): Promise<string> {
  const base = toSlug(title);
  let candidate = base;
  let suffix = 2;

  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, candidate))
      .limit(1);

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  // Fallback: append random suffix
  candidate = `${base}-${Date.now().toString(36)}`;
  return candidate;
}
