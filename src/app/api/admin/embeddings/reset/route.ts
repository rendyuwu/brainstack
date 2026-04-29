import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chunks, chunkEmbeddings } from '@/db/schema';
import { sql, count } from 'drizzle-orm';
import { embedChunks } from '@/lib/rag/embedder';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth';
import { embeddingResetSchema, validateBody } from '@/lib/validation';

const BATCH_SIZE = 20;

/**
 * §V.52: POST without confirm=true returns chunk count + warning.
 * POST with confirm=true proceeds with reset.
 */
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    // Parse body — treat empty/missing body as "no confirmation" (show preview)
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // Empty body or invalid JSON — treat as no confirmation
    }
    const v = validateBody(embeddingResetSchema, body);

    if (!v.success) {
      // No confirm=true — return chunk count as preview
      const [totalResult] = await db.select({ n: count() }).from(chunks);
      return NextResponse.json({
        warning: 'This will delete all embeddings and re-embed all chunks',
        totalChunks: totalResult.n,
        action: 'Send { "confirm": true } to proceed',
      });
    }

    // Delete all existing embeddings
    await db.delete(chunkEmbeddings);

    // Get all chunks
    const allChunks = await db
      .select({ id: chunks.id, content: chunks.content })
      .from(chunks);

    const total = allChunks.length;

    if (total === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        total: 0,
        errors: 0,
        message: 'No chunks to embed',
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
            const batch = allChunks.slice(i, i + BATCH_SIZE);

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
    console.error('POST /api/admin/embeddings/reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset embeddings' },
      { status: 500 },
    );
  }
}
