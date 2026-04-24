import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function uniqueSlug(title: string): Promise<string> {
  const base = toSlug(title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.slug, candidate))
      .limit(1);

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}
