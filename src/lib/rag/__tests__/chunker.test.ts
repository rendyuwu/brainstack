import { describe, it, expect } from 'vitest';
import { chunkMDX } from '../chunker';

describe('chunkMDX', () => {
  it('returns empty array for empty input', () => {
    expect(chunkMDX('')).toEqual([]);
  });

  it('returns single chunk with anchorId "intro" for plain prose', () => {
    const result = chunkMDX('Hello world.\nThis is a paragraph.');
    expect(result).toHaveLength(1);
    expect(result[0].anchorId).toBe('intro');
    expect(result[0].headingPath).toEqual([]);
    expect(result[0].contentType).toBe('prose');
  });

  it('splits on H1/H2/H3 headings with correct headingPath', () => {
    const md = `Intro text

# Chapter One

Some content

## Section A

Details here

### Subsection

Deep content`;

    const result = chunkMDX(md);
    expect(result.length).toBeGreaterThanOrEqual(4);

    expect(result[0].anchorId).toBe('intro');
    expect(result[0].headingPath).toEqual([]);

    const chapterChunk = result.find((c) => c.anchorId === 'chapter-one');
    expect(chapterChunk).toBeDefined();
    expect(chapterChunk!.headingPath).toEqual(['Chapter One']);

    const sectionChunk = result.find((c) => c.anchorId === 'section-a');
    expect(sectionChunk).toBeDefined();
    expect(sectionChunk!.headingPath).toEqual(['Chapter One', 'Section A']);

    const subChunk = result.find((c) => c.anchorId === 'subsection');
    expect(subChunk).toBeDefined();
    expect(subChunk!.headingPath).toEqual([
      'Chapter One',
      'Section A',
      'Subsection',
    ]);
  });

  it('does not split on # inside code blocks', () => {
    const md = `# Real Heading

\`\`\`python
# this is a comment
x = 1
\`\`\``;

    const result = chunkMDX(md);
    expect(result).toHaveLength(2);
    expect(result.every((chunk) => chunk.anchorId === 'real-heading')).toBe(true);
    expect(result[1].content).toContain('# this is a comment');
  });

  it('splits long content with code blocks into separate chunks', () => {
    const prose = 'A'.repeat(800);
    const code = '```\n' + 'B'.repeat(800) + '\n```';
    const md = `# Section\n\n${prose}\n\n${code}`;

    const result = chunkMDX(md);
    expect(result.length).toBeGreaterThan(1);

    const codeChunk = result.find((c) => c.contentType === 'code');
    expect(codeChunk).toBeDefined();

    const proseChunk = result.find((c) => c.contentType === 'prose');
    expect(proseChunk).toBeDefined();
  });

  it('separates short code blocks from prose', () => {
    const md = `# Section

Before code.

\`\`\`bash
echo hi
\`\`\`

After code.`;

    const result = chunkMDX(md);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.contentType)).toEqual(['prose', 'code', 'prose']);
  });

  it('separates tilde fenced code blocks from prose', () => {
    const md = `Before

~~~bash
echo hi
~~~

After`;

    const result = chunkMDX(md);
    expect(result).toHaveLength(3);
    expect(result[1].contentType).toBe('code');
  });

  it('splits long prose by token window', () => {
    const md = Array.from({ length: 900 }, (_, i) => `word${i}`).join(' ');

    const result = chunkMDX(md);
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((chunk) => chunk.content.split(/\s+/).length <= 400)).toBe(true);
  });

  it('handles nested headings resetting the stack correctly', () => {
    const md = `# H1

## H2 under H1

# Another H1

## H2 under Another`;

    const result = chunkMDX(md);
    const lastChunk = result.find((c) => c.anchorId === 'h2-under-another');
    expect(lastChunk).toBeDefined();
    expect(lastChunk!.headingPath).toEqual(['Another H1', 'H2 under Another']);
  });

  it('detects code content type', () => {
    const md = '```js\nconsole.log("hi")\n```';
    const result = chunkMDX(md);
    expect(result).toHaveLength(1);
    expect(result[0].contentType).toBe('code');
  });

  it('detects list content type', () => {
    const md = '- item one\n- item two\n- item three';
    const result = chunkMDX(md);
    expect(result).toHaveLength(1);
    expect(result[0].contentType).toBe('list');
  });

  it('detects callout content type', () => {
    const md = '<Callout type="info">Important note</Callout>';
    const result = chunkMDX(md);
    expect(result).toHaveLength(1);
    expect(result[0].contentType).toBe('callout');
  });
});
