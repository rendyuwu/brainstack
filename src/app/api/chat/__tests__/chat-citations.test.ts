import { describe, it, expect } from 'vitest';
import { contentSnippet } from '../route';

describe('contentSnippet', () => {
  it('collapses whitespace and caps citation snippets', () => {
    const snippet = contentSnippet('one\n\n two   three', 20);
    expect(snippet).toBe('one two three');
  });

  it('strips fenced code from snippets', () => {
    const snippet = contentSnippet('Before\n```bash\necho secret\n```\nAfter');
    expect(snippet).toBe('Before After');
  });

  it('adds ellipsis when truncated', () => {
    const snippet = contentSnippet('alpha beta gamma delta', 12);
    expect(snippet).toBe('alpha beta…');
  });
});
