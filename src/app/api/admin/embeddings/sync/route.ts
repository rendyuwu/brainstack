import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chunks, chunkEmbeddings } from '@/db/schema';
import { sql, notInArray } from 'drizzle-orm';
import { embedChunks } from '@/lib/rag/embedder';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';

const BATCH_SIZE = 20;

export async function POST() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    // Find chunks without embeddings
    const embeddedChunkIds = db
      .select({ chunkId: chunkEmbeddings.chunkId })
      .from(chunkEmbeddings);

    const unembeddedChunks = await db
      .select({ id: chunks.id, content: chunks.content })
      .from(chunks)
      .where(notInArray(chunks.id, embeddedChunkIds));

    const total = unembeddedChunks.length;

    if (total === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        total: 0,
        errors: 0,
        message: 'All chunks already have embeddings',
      });
    }

    // Stream progress as NDJSON
    const encoder = new TextEncoder();
    let processed = 0;
    let errors = 0;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = unembeddedChunks.slice(i, i + BATCH_SIZE);

            try {
              const result = await embedChunks(batch);

              if (result) {
                const embeddingValues = batch.map((chunk, j) => ({
                  chunkId: chunk.id,
                  embeddingModel: result.modelId,
                  embedding: sql`${`[${result.embeddings[j].join(',')}]`}::vector`,
                }));

                await db.insert(chunkEmbeddings).values(embeddingValues);
                processed += batch.length;
              } else {
                errors += batch.length;
              }
            } catch (err) {
              console.error('Embedding batch failed:', err);
              errors += batch.length;
            }

            // Send progress
            const progress = JSON.stringify({
              processed,
              total,
              errors,
              done: false,
            });
            controller.enqueue(encoder.encode(progress + '\n'));
          }

          // Final summary
          const summary = JSON.stringify({
            processed,
            total,
            errors,
            done: true,
          });
          controller.enqueue(encoder.encode(summary + '\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/admin/embeddings/sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync embeddings' },
      { status: 500 },
    );
  }
}
