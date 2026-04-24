export interface Chunk {
  anchorId: string;
  headingPath: string[];
  content: string;
  contentType: 'prose' | 'code' | 'list' | 'callout';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function detectContentType(
  block: string
): 'prose' | 'code' | 'list' | 'callout' {
  const trimmed = block.trim();
  if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) return 'code';
  if (trimmed.startsWith('<Callout') || trimmed.startsWith('<callout'))
    return 'callout';
  // Check if majority of lines are list items
  const lines = trimmed.split('\n').filter((l) => l.trim());
  const listLines = lines.filter((l) => /^\s*[-*+]\s|^\s*\d+\.\s/.test(l));
  if (listLines.length > lines.length / 2) return 'list';
  return 'prose';
}

export function chunkMDX(mdxSource: string): Chunk[] {
  const lines = mdxSource.split('\n');
  const chunks: Chunk[] = [];

  // Track heading hierarchy
  const headingStack: { level: number; text: string }[] = [];
  let currentContent: string[] = [];
  let inCodeBlock = false;

  function getHeadingPath(): string[] {
    return headingStack.map((h) => h.text);
  }

  function getAnchorId(): string {
    if (headingStack.length === 0) return 'intro';
    return slugify(headingStack[headingStack.length - 1].text);
  }

  function flushChunk() {
    const content = currentContent.join('\n').trim();
    if (!content) return;

    // If the content is very long, split on code blocks
    const codeBlockPattern = /^```[\s\S]*?^```/gm;
    const hasCodeBlocks = codeBlockPattern.test(content);

    if (hasCodeBlocks && content.length > 1500) {
      // Split into prose and code chunks
      const parts = content.split(/(```[\s\S]*?```)/gm);
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        chunks.push({
          anchorId: getAnchorId(),
          headingPath: getHeadingPath(),
          content: trimmed,
          contentType: detectContentType(trimmed),
        });
      }
    } else {
      chunks.push({
        anchorId: getAnchorId(),
        headingPath: getHeadingPath(),
        content,
        contentType: detectContentType(content),
      });
    }

    currentContent = [];
  }

  for (const line of lines) {
    // Track code blocks to avoid treating # inside code as headings
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      currentContent.push(line);
      continue;
    }

    if (inCodeBlock) {
      currentContent.push(line);
      continue;
    }

    // Check for headings (## and ###)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      // Flush content from previous section
      flushChunk();

      // Update heading stack
      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= level
      ) {
        headingStack.pop();
      }
      headingStack.push({ level, text });

      // Include the heading in the new chunk's content
      currentContent.push(line);
      continue;
    }

    currentContent.push(line);
  }

  // Flush remaining content
  flushChunk();

  return chunks;
}
