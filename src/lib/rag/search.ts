import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { embedQuery } from './embedder';
import { rerankBM25 } from './reranker';

export interface SearchResult {
  chunkId: string;
  pageId: string;
  pageTitle: string;
  pageSlug: string;
  anchorId: string | null;
  headingPath: string[];
  content: string;
  score: number;
}

interface RawLexicalRow {
  id: string;
  page_id: string;
  anchor_id: string | null;
  heading_path: string[] | null;
  content: string;
  rank: number;
}

interface RawSemanticRow {
  id: string;
  page_id: string;
  anchor_id: string | null;
  heading_path: string[] | null;
  content: string;
  similarity: number;
}

interface PageMeta {
  id: string;
  title: string;
  slug: string;
}

const RRF_K = 60;

export function rrf(ranks: number[]): number {
  return ranks.reduce((sum, rank) => sum + 1 / (RRF_K + rank), 0);
}

export function extractRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const obj = result as { rows?: T[] };
  return obj?.rows ?? [];
}

export async function hybridSearch(
  query: string,
  options?: {
    scopeType?: 'page' | 'collection' | 'site';
    scopeId?: string;
    limit?: number;
    rerank?: boolean | 'bm25';
  }
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 10;

  // Build scope filter
  let scopeFilter = sql``;
  if (options?.scopeType === 'page' && options.scopeId) {
    scopeFilter = sql` AND c.page_id = ${options.scopeId}::uuid`;
  } else if (options?.scopeType === 'collection' && options.scopeId) {
    scopeFilter = sql` AND p.collection_id = ${options.scopeId}::uuid`;
  }

  // 1. Lexical search
  const lexicalRaw = await db.execute(sql`
    SELECT c.id, c.page_id, c.anchor_id, c.heading_path, c.content,
           ts_rank(c.fts, plainto_tsquery('english', ${query})) as rank
    FROM chunks c
    JOIN pages p ON p.id = c.page_id
    WHERE p.status = 'published'
      AND c.fts @@ plainto_tsquery('english', ${query})
    ${scopeFilter}
    ORDER BY rank DESC
    LIMIT 20
  `);

  // 2. Semantic search (if embeddings exist)
  let semanticRaw: unknown = [];
  try {
    const embeddingVector = await embedQuery(query);
    if (embeddingVector) {
      const vectorStr = `[${embeddingVector.join(',')}]`;
      semanticRaw = await db.execute(sql`
        SELECT c.id, c.page_id, c.anchor_id, c.heading_path, c.content,
               1 - (ce.embedding <=> ${vectorStr}::vector) as similarity
        FROM chunk_embeddings ce
        JOIN chunks c ON c.id = ce.chunk_id
        JOIN pages p ON p.id = c.page_id
        WHERE p.status = 'published' ${scopeFilter}
        ORDER BY ce.embedding <=> ${vectorStr}::vector
        LIMIT 20
      `);
    }
  } catch {
    // Semantic search is optional
  }

  // 3. Reciprocal Rank Fusion
  const scoreMap = new Map<
    string,
    {
      chunkId: string;
      pageId: string;
      anchorId: string | null;
      headingPath: string[];
      content: string;
      ranks: number[];
    }
  >();

  const lexicalRows = extractRows<RawLexicalRow>(lexicalRaw);

  lexicalRows.forEach((row, idx) => {
    const existing = scoreMap.get(row.id);
    if (existing) {
      existing.ranks.push(idx + 1);
    } else {
      scoreMap.set(row.id, {
        chunkId: row.id,
        pageId: row.page_id,
        anchorId: row.anchor_id,
        headingPath: row.heading_path ?? [],
        content: row.content,
        ranks: [idx + 1],
      });
    }
  });

  const semanticRows = extractRows<RawSemanticRow>(semanticRaw);

  semanticRows.forEach((row, idx) => {
    const existing = scoreMap.get(row.id);
    if (existing) {
      existing.ranks.push(idx + 1);
    } else {
      scoreMap.set(row.id, {
        chunkId: row.id,
        pageId: row.page_id,
        anchorId: row.anchor_id,
        headingPath: row.heading_path ?? [],
        content: row.content,
        ranks: [idx + 1],
      });
    }
  });

  // Score and sort
  const scored = Array.from(scoreMap.values()).map((entry) => ({
    ...entry,
    score: rrf(entry.ranks),
  }));

  scored.sort((a, b) => b.score - a.score);

  let topResults: typeof scored;

  if (options?.rerank !== false) {
    const reranked = rerankBM25(
      query,
      scored.slice(0, 20).map((s) => ({ id: s.chunkId, content: s.content, score: s.score })),
      limit
    );
    const rerankedMap = new Map(reranked.map((r, i) => [r.id, { score: r.score, idx: i }]));
    topResults = scored
      .filter((s) => rerankedMap.has(s.chunkId))
      .map((s) => ({ ...s, score: rerankedMap.get(s.chunkId)!.score }))
      .sort((a, b) => b.score - a.score);
  } else {
    topResults = scored.slice(0, limit);
  }

  if (topResults.length === 0) return [];

  // 4. Fetch page metadata
  const pageIds = [...new Set(topResults.map((r) => r.pageId))];
  const pageMetaRaw = await db.execute(sql`
    SELECT id, title, slug FROM pages WHERE status = 'published' AND id = ANY(${pageIds}::uuid[])
  `);

  const pageMetaRows = extractRows<PageMeta>(pageMetaRaw);
  const pageMap = new Map<string, PageMeta>();
  for (const p of pageMetaRows) {
    pageMap.set(p.id, p);
  }

  return topResults.map((r) => {
    const page = pageMap.get(r.pageId);
    return {
      chunkId: r.chunkId,
      pageId: r.pageId,
      pageTitle: page?.title ?? 'Unknown',
      pageSlug: page?.slug ?? '',
      anchorId: r.anchorId,
      headingPath: r.headingPath,
      content: r.content,
      score: r.score,
    };
  });
}
