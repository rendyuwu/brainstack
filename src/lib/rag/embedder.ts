import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from '@/lib/ai/client';
import { logAIUsage } from '@/lib/ai/usage-logger';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from '@/lib/ai/types';

/** Must match the vector(N) column in chunk_embeddings */
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingCandidate {
  provider: ProviderConfig;
  modelId: string;
}

async function findEmbeddingCandidates(): Promise<EmbeddingCandidate[]> {
  const providers = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.enabled, true));

  const candidates: EmbeddingCandidate[] = [];

  for (const row of providers) {
    const models = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.providerId, row.id),
          eq(aiModels.supportsEmbeddings, true)
        )
      );

    const providerConfig: ProviderConfig = {
      id: row.id,
      label: row.label,
      kind: row.kind as ProviderKind,
      baseUrl: row.baseUrl,
      apiKeySecretRef: row.apiKeySecretRef,
      defaultHeaders:
        (row.defaultHeaders as Record<string, string>) ?? null,
      discoveryMode: row.discoveryMode as DiscoveryMode,
      enabled: row.enabled,
    };

    for (const model of models) {
      candidates.push({ provider: providerConfig, modelId: model.modelId });
    }
  }

  return candidates;
}

export async function embedChunks(
  chunks: { content: string }[]
): Promise<{ embeddings: number[][]; modelId: string } | null> {
  const candidates = await findEmbeddingCandidates();
  if (candidates.length === 0) return null;

  for (const { provider, modelId } of candidates) {
    try {
      const client = createAIClient(provider);
      const startTime = Date.now();
      const response = await client.embeddings.create({
        model: modelId,
        input: chunks.map((c) => c.content),
        dimensions: EMBEDDING_DIMENSIONS,
      });

      logAIUsage({
        providerId: provider.id,
        modelId,
        endpoint: 'embed',
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.total_tokens,
        durationMs: Date.now() - startTime,
      });

      return {
        embeddings: response.data.map((d) => d.embedding),
        modelId,
      };
    } catch (err) {
      console.warn(`Embedding model ${modelId} failed, trying next...`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}

export async function embedQuery(query: string): Promise<number[] | null> {
  const candidates = await findEmbeddingCandidates();
  if (candidates.length === 0) return null;

  for (const { provider, modelId } of candidates) {
    try {
      const client = createAIClient(provider);
      const startTime = Date.now();
      const response = await client.embeddings.create({
        model: modelId,
        input: [query],
        dimensions: EMBEDDING_DIMENSIONS,
      });

      logAIUsage({
        providerId: provider.id,
        modelId,
        endpoint: 'embed',
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.total_tokens,
        durationMs: Date.now() - startTime,
      });

      return response.data[0].embedding;
    } catch (err) {
      console.warn(`Embedding model ${modelId} failed, trying next...`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}
