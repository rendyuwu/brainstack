import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from '@/lib/ai/client';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from '@/lib/ai/types';

async function findEmbeddingProvider(): Promise<{
  provider: ProviderConfig;
  modelId: string;
} | null> {
  const providers = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.enabled, true));

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

    if (models.length > 0) {
      return {
        provider: {
          id: row.id,
          label: row.label,
          kind: row.kind as ProviderKind,
          baseUrl: row.baseUrl,
          apiKeySecretRef: row.apiKeySecretRef,
          defaultHeaders:
            (row.defaultHeaders as Record<string, string>) ?? null,
          discoveryMode: row.discoveryMode as DiscoveryMode,
          enabled: row.enabled,
        },
        modelId: models[0].modelId,
      };
    }
  }

  return null;
}

export async function embedChunks(
  chunks: { content: string }[]
): Promise<number[][] | null> {
  const result = await findEmbeddingProvider();
  if (!result) return null;

  const { provider, modelId } = result;
  const client = createAIClient(provider);

  const response = await client.embeddings.create({
    model: modelId,
    input: chunks.map((c) => c.content),
  });

  return response.data.map((d) => d.embedding);
}

export async function embedQuery(query: string): Promise<number[] | null> {
  const result = await findEmbeddingProvider();
  if (!result) return null;

  const { provider, modelId } = result;
  const client = createAIClient(provider);

  const response = await client.embeddings.create({
    model: modelId,
    input: [query],
  });

  return response.data[0].embedding;
}
