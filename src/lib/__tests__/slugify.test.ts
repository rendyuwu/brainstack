import { describe, it, expect } from 'vitest';
import { toSlug } from '../slugify';

describe('toSlug', () => {
  it('converts spaces to hyphens', () => {
    expect(toSlug('hello world')).toBe('hello-world');
  });

  it('lowercases input', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(toSlug('hello! @world#')).toBe('hello-world');
  });

  it('collapses multiple hyphens', () => {
    expect(toSlug('hello---world')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(toSlug('-hello world-')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(toSlug('')).toBe('untitled');
  });

  it('handles already-slugified input', () => {
    expect(toSlug('already-slugified')).toBe('already-slugified');
  });

  it('normalizes unicode diacritics to ASCII equivalents', () => {
    expect(toSlug('café résumé')).toBe('cafe-resume');
  });

  it('handles multiple spaces', () => {
    expect(toSlug('hello   world')).toBe('hello-world');
  });

  it('handles whitespace-only input', () => {
    expect(toSlug('   ')).toBe('untitled');
  });

  it('preserves CJK characters', () => {
    expect(toSlug('Kubernetes の基本')).toBe('kubernetes-の基本');
  });
});
