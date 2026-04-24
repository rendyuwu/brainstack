export interface RerankCandidate {
  id: string;
  content: string;
  score: number;
}

interface BM25Params {
  k1: number;
  b: number;
}

const DEFAULT_BM25: BM25Params = { k1: 1.2, b: 0.75 };

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor',
  'so', 'if', 'then', 'than', 'that', 'this', 'these', 'those', 'it',
  'its', 'as', 'up', 'out', 'about',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

export function idf(term: string, docs: string[][]): number {
  const n = docs.length;
  const df = docs.filter((d) => d.includes(term)).length;
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

export function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  avgDl: number,
  corpusDocs: string[][],
  params: BM25Params = DEFAULT_BM25
): number {
  const dl = docTokens.length;
  let score = 0;

  for (const term of queryTokens) {
    const tf = docTokens.filter((t) => t === term).length;
    const termIdf = idf(term, corpusDocs);
    const numerator = tf * (params.k1 + 1);
    const denominator = tf + params.k1 * (1 - params.b + params.b * (dl / avgDl));
    score += termIdf * (numerator / denominator);
  }

  return score;
}

function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1);
  return values.map((v) => (v - min) / (max - min));
}

export function rerankBM25(
  query: string,
  candidates: RerankCandidate[],
  limit?: number
): RerankCandidate[] {
  if (candidates.length === 0) return [];

  const queryTokens = tokenize(query);
  const docTokensList = candidates.map((c) => tokenize(c.content));
  const avgDl = docTokensList.reduce((sum, d) => sum + d.length, 0) / docTokensList.length;

  const bm25Scores = candidates.map((_, i) =>
    bm25Score(queryTokens, docTokensList[i], avgDl, docTokensList)
  );

  const normalizedBm25 = minMaxNormalize(bm25Scores);
  const normalizedOriginal = minMaxNormalize(candidates.map((c) => c.score));

  const combined = candidates.map((c, i) => ({
    ...c,
    score: 0.6 * normalizedBm25[i] + 0.4 * normalizedOriginal[i],
  }));

  combined.sort((a, b) => b.score - a.score);
  return limit ? combined.slice(0, limit) : combined;
}
