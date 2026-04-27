import { db } from '@/db';
import { chunks, chunkEmbeddings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { chunkMDX } from './chunker';
import { embedChunks } from './embedder';

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`[^`]+`/g, '') // remove inline code
    .replace(/<[^>]+>/g, '') // remove HTML/MDX tags
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links -> text
    .replace(/[#*_~>`|]/g, '') // remove markdown chars
    .replace(/\n{2,}/g, '\n') // collapse newlines
    .trim();
}

export async function runPublishPipeline(
  pageId: string,
  revisionId: string,
  mdxSource: string
): Promise<void> {
  // 1. Delete existing chunks for this page (cascade deletes embeddings)
  await db.delete(chunks).where(eq(chunks.pageId, pageId));

  // 2. Chunk the MDX
  const mdxChunks = chunkMDX(mdxSource);

  if (mdxChunks.length === 0) return;

  // 3. Filter and prepare chunk values
  const chunkValues = mdxChunks
    .map((chunk) => {
      const plainText = stripMarkdown(chunk.content);
      if (!plainText.trim()) return null;
      return {
        pageId,
        revisionId,
        anchorId: chunk.anchorId,
        headingPath: chunk.headingPath,
        content: chunk.content,
        contentType: chunk.contentType,
        fts: sql`to_tsvector('english', ${plainText})`,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (chunkValues.length === 0) return;

  // 4. Batch insert all chunks
  const insertedChunks = await db
    .insert(chunks)
    .values(chunkValues)
    .returning({ id: chunks.id, content: chunks.content });

  // 5. Try to generate embeddings (optional)
  try {
    const embeddings = await embedChunks(insertedChunks);
    if (embeddings) {
      const embeddingValues = insertedChunks.map((chunk, i) => ({
        chunkId: chunk.id,
        embeddingModel: 'default',
        embedding: sql`${`[${embeddings[i].join(',')}]`}::vector`,
      }));

      await db.insert(chunkEmbeddings).values(embeddingValues);
    }
  } catch (err) {
    // Embeddings are optional — log but don't block publish
    console.error('Embedding generation failed:', err);
  }
}
