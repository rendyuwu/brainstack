import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { embedQuery } from './embedder';
import { extractRows } from './search';

export interface DuplicateMatch {
  pageId: string;
  title: string;
  slug: string;
  similarity: number;
  matchType: 'title' | 'content';
}

interface RawTitleRow {
  id: string;
  title: string;
  slug: string;
  sim: number;
}

interface RawContentRow {
  page_id: string;
  title: string;
  slug: string;
  sim: number;
}

export async function detectDuplicates(
  pageId: string,
  title: string,
  content: string
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const seen = new Set<string>();

  try {
    const titleRaw = await db.execute(sql`
      SELECT id, title, slug, similarity(title, ${title}) as sim
      FROM pages
      WHERE id != ${pageId}::uuid
        AND status = 'published'
        AND similarity(title, ${title}) > 0.4
      ORDER BY sim DESC
      LIMIT 5
    `);

    for (const row of extractRows<RawTitleRow>(titleRaw)) {
      seen.add(row.id);
      matches.push({
        pageId: row.id,
        title: row.title,
        slug: row.slug,
        similarity: Number(row.sim),
        matchType: 'title',
      });
    }
  } catch {
    // pg_trgm not available — skip title similarity
  }

  try {
    const embedding = await embedQuery(content.slice(0, 2000));
    if (embedding) {
      const vectorStr = `[${embedding.join(',')}]`;
      const contentRaw = await db.execute(sql`
        SELECT DISTINCT ON (c.page_id)
               c.page_id, p.title, p.slug,
               1 - (ce.embedding <=> ${vectorStr}::vector) as sim
        FROM chunk_embeddings ce
        JOIN chunks c ON c.id = ce.chunk_id
        JOIN pages p ON p.id = c.page_id
        WHERE c.page_id != ${pageId}::uuid
          AND p.status = 'published'
          AND 1 - (ce.embedding <=> ${vectorStr}::vector) > 0.9
        ORDER BY c.page_id, sim DESC
        LIMIT 5
      `);

      for (const row of extractRows<RawContentRow>(contentRaw)) {
        if (!seen.has(row.page_id)) {
          matches.push({
            pageId: row.page_id,
            title: row.title,
            slug: row.slug,
            similarity: Number(row.sim),
            matchType: 'content',
          });
        }
      }
    }
  } catch {
    // embedding not available — skip content similarity
  }

  return matches;
}
