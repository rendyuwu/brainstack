import { describe, it, expect } from 'vitest';
import { rrf, extractRows } from '../search';

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
