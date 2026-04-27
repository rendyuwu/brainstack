export interface Chunk {
  anchorId: string;
  headingPath: string[];
  content: string;
  contentType: 'prose' | 'code' | 'list' | 'callout';
}

const MAX_CHUNK_TOKENS = 400;

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
  const lines = trimmed.split('\n').filter((l) => l.trim());
  const listLines = lines.filter((l) => /^\s*[-*+]\s|^\s*\d+\.\s/.test(l));
  if (listLines.length > lines.length / 2) return 'list';
  return 'prose';
}

function tokenCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitWords(text: string, maxTokens: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxTokens) {
    chunks.push(words.slice(i, i + maxTokens).join(' '));
  }
  return chunks;
}

function splitProse(content: string): string[] {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  function flush() {
    if (current.length === 0) return;
    chunks.push(current.join('\n\n'));
    current = [];
    currentTokens = 0;
  }

  for (const paragraph of paragraphs) {
    const count = tokenCount(paragraph);
    if (count > MAX_CHUNK_TOKENS) {
      flush();
      chunks.push(...splitWords(paragraph, MAX_CHUNK_TOKENS));
      continue;
    }

    if (currentTokens > 0 && currentTokens + count > MAX_CHUNK_TOKENS) {
      flush();
    }

    current.push(paragraph);
    currentTokens += count;
  }

  flush();
  return chunks;
}

function splitCodeAndProse(content: string): Array<{ content: string; code: boolean }> {
  const lines = content.split('\n');
  const blocks: Array<{ content: string; code: boolean }> = [];
  let proseLines: string[] = [];
  let codeLines: string[] | null = null;
  let fence = '';

  function flushProse() {
    const prose = proseLines.join('\n').trim();
    if (prose) blocks.push({ content: prose, code: false });
    proseLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = trimmed.match(/^(```|~~~)/);

    if (codeLines) {
      codeLines.push(line);
      if (trimmed.startsWith(fence)) {
        blocks.push({ content: codeLines.join('\n').trim(), code: true });
        codeLines = null;
        fence = '';
      }
      continue;
    }

    if (fenceMatch) {
      flushProse();
      fence = fenceMatch[1];
      codeLines = [line];
      continue;
    }

    proseLines.push(line);
  }

  if (codeLines) blocks.push({ content: codeLines.join('\n').trim(), code: true });
  flushProse();
  return blocks;
}

export function chunkMDX(mdxSource: string): Chunk[] {
  const lines = mdxSource.split('\n');
  const chunks: Chunk[] = [];
  const headingStack: { level: number; text: string }[] = [];
  let currentContent: string[] = [];

  function getHeadingPath(): string[] {
    return headingStack.map((h) => h.text);
  }

  function getAnchorId(): string {
    if (headingStack.length === 0) return 'intro';
    return slugify(headingStack[headingStack.length - 1].text);
  }

  function emit(content: string, contentType: Chunk['contentType']) {
    chunks.push({
      anchorId: getAnchorId(),
      headingPath: getHeadingPath(),
      content,
      contentType,
    });
  }

  function flushChunk() {
    const content = currentContent.join('\n').trim();
    if (!content) return;

    for (const block of splitCodeAndProse(content)) {
      if (block.code) {
        emit(block.content, 'code');
        continue;
      }

      for (const proseChunk of splitProse(block.content)) {
        emit(proseChunk, detectContentType(proseChunk));
      }
    }

    currentContent = [];
  }

  let codeFenceMarker: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (codeFenceMarker) {
      // Only close if same marker type
      if (trimmed.startsWith(codeFenceMarker)) {
        codeFenceMarker = null;
      }
      currentContent.push(line);
      continue;
    }
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      codeFenceMarker = trimmed.startsWith('```') ? '```' : '~~~';
      currentContent.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushChunk();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= level
      ) {
        headingStack.pop();
      }
      headingStack.push({ level, text });
      currentContent.push(line);
      continue;
    }

    currentContent.push(line);
  }

  flushChunk();
  return chunks;
}
