import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecute = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    execute: mockExecute,
  },
}));

import { rrf, extractRows, getPageChunks } from '../search';

function sqlText(query: unknown) {
  return (query as { queryChunks: Array<string | { value: string[] }> }).queryChunks
    .map((chunk) => typeof chunk === 'string' ? '?' : chunk.value.join(''))
    .join('');
}

describe('rrf', () => {
  it('computes reciprocal rank fusion score for single rank', () => {
    const score = rrf([1]);
    expect(score).toBeCloseTo(1 / (60 + 1), 10);
  });

  it('computes RRF score for multiple ranks', () => {
    const score = rrf([1, 3]);
    const expected = 1 / (60 + 1) + 1 / (60 + 3);
    expect(score).toBeCloseTo(expected, 10);
  });

  it('returns 0 for empty ranks', () => {
    expect(rrf([])).toBe(0);
  });

  it('higher ranks produce higher scores', () => {
    const highRank = rrf([1]);
    const lowRank = rrf([10]);
    expect(highRank).toBeGreaterThan(lowRank);
  });
});

describe('extractRows', () => {
  it('returns array input as-is', () => {
    const arr = [{ id: '1' }, { id: '2' }];
    expect(extractRows(arr)).toBe(arr);
  });

  it('extracts rows from object with rows property', () => {
    const rows = [{ id: 'a' }];
    expect(extractRows({ rows })).toBe(rows);
  });

  it('returns empty array for object without rows', () => {
    expect(extractRows({})).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(extractRows(null)).toEqual([]);
    expect(extractRows(undefined)).toEqual([]);
  });
});

describe('getPageChunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches published page chunks in persisted document order', async () => {
    mockExecute.mockResolvedValue({
      rows: [
        {
          id: 'chunk-1',
          page_id: 'page-1',
          page_title: 'Post',
          page_slug: 'post',
          anchor_id: 'intro',
          heading_path: ['Intro'],
          content: 'First chunk',
        },
        {
          id: 'chunk-2',
          page_id: 'page-1',
          page_title: 'Post',
          page_slug: 'post',
          anchor_id: 'next',
          heading_path: ['Next'],
          content: 'Second chunk',
        },
      ],
    });

    const results = await getPageChunks('00000000-0000-0000-0000-000000000001');
    const query = sqlText(mockExecute.mock.calls[0][0]);

    expect(query).toContain("WHERE p.status = 'published'");
    expect(query).toContain('AND c.page_id = ?::uuid');
    expect(query).toContain('ORDER BY c.chunk_index ASC');
    expect(query).not.toContain('plainto_tsquery');
    expect(results.map((result) => result.content)).toEqual(['First chunk', 'Second chunk']);
    expect(results.map((result) => result.score)).toEqual([1, 0.5]);
  });
});
