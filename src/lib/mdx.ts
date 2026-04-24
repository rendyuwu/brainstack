import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx-components';

export async function renderMDX(source: string) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
    },
  });
  return content;
}

/**
 * Extract headings from MDX source for table-of-contents generation.
 * Returns an array of { id, label, depth } objects.
 */
export function extractHeadings(source: string) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { id: string; label: string; depth: number }[] = [];
  let match;

  while ((match = headingRegex.exec(source)) !== null) {
    const depth = match[1].length;
    const label = match[2].replace(/\*\*|__|`/g, '').trim();
    const id = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    headings.push({ id, label, depth });
  }

  return headings;
}

/**
 * Estimate reading time from text content.
 */
export function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
