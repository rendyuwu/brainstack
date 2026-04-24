import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createAIClient } from './client';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from './types';

// ---------- helpers ----------

function rowToProviderConfig(row: typeof aiProviders.$inferSelect): ProviderConfig {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind as ProviderKind,
    baseUrl: row.baseUrl,
    apiKeySecretRef: row.apiKeySecretRef,
    defaultHeaders: (row.defaultHeaders as Record<string, string>) ?? null,
    discoveryMode: row.discoveryMode as DiscoveryMode,
    enabled: row.enabled,
  };
}

// ---------- CRUD ----------

export async function getProviders() {
  const rows = await db.select().from(aiProviders).orderBy(aiProviders.label);

  const models = await db.select().from(aiModels);

  return rows.map((row) => ({
    ...rowToProviderConfig(row),
    models: models.filter((m) => m.providerId === row.id),
  }));
}

export async function getProvider(id: string) {
  const [row] = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.id, id))
    .limit(1);

  if (!row) return null;

  const models = await db
    .select()
    .from(aiModels)
    .where(eq(aiModels.providerId, id));

  return {
    ...rowToProviderConfig(row),
    models,
  };
}

export async function createProvider(data: {
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  apiKeySecretRef?: string | null;
  defaultHeaders?: Record<string, string> | null;
  discoveryMode?: DiscoveryMode;
  enabled?: boolean;
}) {
  const [row] = await db
    .insert(aiProviders)
    .values({
      label: data.label,
      kind: data.kind,
      baseUrl: data.baseUrl,
      apiKeySecretRef: data.apiKeySecretRef ?? null,
      defaultHeaders: data.defaultHeaders ?? null,
      discoveryMode: data.discoveryMode ?? 'v1-models',
      enabled: data.enabled ?? true,
    })
    .returning();

  return rowToProviderConfig(row);
}

export async function updateProvider(
  id: string,
  data: Partial<{
    label: string;
    kind: ProviderKind;
    baseUrl: string;
    apiKeySecretRef: string | null;
    defaultHeaders: Record<string, string> | null;
    discoveryMode: DiscoveryMode;
    enabled: boolean;
  }>,
) {
  const updates: Record<string, unknown> = {};
  if (data.label !== undefined) updates.label = data.label;
  if (data.kind !== undefined) updates.kind = data.kind;
  if (data.baseUrl !== undefined) updates.baseUrl = data.baseUrl;
  if (data.apiKeySecretRef !== undefined) updates.apiKeySecretRef = data.apiKeySecretRef;
  if (data.defaultHeaders !== undefined) updates.defaultHeaders = data.defaultHeaders;
  if (data.discoveryMode !== undefined) updates.discoveryMode = data.discoveryMode;
  if (data.enabled !== undefined) updates.enabled = data.enabled;

  if (Object.keys(updates).length === 0) {
    return getProvider(id);
  }

  const [row] = await db
    .update(aiProviders)
    .set(updates)
    .where(eq(aiProviders.id, id))
    .returning();

  if (!row) return null;
  return rowToProviderConfig(row);
}

export async function deleteProvider(id: string) {
  const [row] = await db
    .delete(aiProviders)
    .where(eq(aiProviders.id, id))
    .returning();
  return !!row;
}

// ---------- test / discover ----------

export async function testConnection(provider: ProviderConfig) {
  try {
    const client = createAIClient(provider);
    const modelsUrl =
      provider.kind === 'openrouter'
        ? '/api/v1/models'
        : '/v1/models';

    const response = await client.get(modelsUrl);
    const body = response as unknown as { data?: unknown[] };
    const modelCount = Array.isArray(body?.data) ? body.data.length : 0;

    return { success: true as const, modelCount };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function detectCapabilities(modelId: string) {
  const id = modelId.toLowerCase();
  return {
    supportsChat: true,
    supportsResponses: id.includes('gpt-4') || id.includes('gpt-3.5'),
    supportsEmbeddings: id.includes('embed'),
    supportsVision:
      id.includes('vision') ||
      id.includes('gpt-4o') ||
      id.includes('claude-3') ||
      id.includes('gemini'),
    contextLength: null as number | null,
  };
}

export async function discoverModels(provider: ProviderConfig) {
  const client = createAIClient(provider);

  let modelsEndpoint: string;
  if (provider.kind === 'openrouter') {
    modelsEndpoint = '/api/v1/models';
  } else if (provider.kind === 'litellm_proxy') {
    modelsEndpoint = '/model/info';
  } else {
    modelsEndpoint = '/v1/models';
  }

  const response = await client.get(modelsEndpoint);
  const body = response as unknown as {
    data?: Array<{ id: string; context_length?: number }>;
  };

  if (!body?.data || !Array.isArray(body.data)) {
    throw new Error('Unexpected response from models endpoint');
  }

  const discovered = [];

  for (const model of body.data) {
    const caps = detectCapabilities(model.id);

    await db
      .insert(aiModels)
      .values({
        providerId: provider.id,
        modelId: model.id,
        displayName: model.id,
        supportsChat: caps.supportsChat,
        supportsResponses: caps.supportsResponses,
        supportsEmbeddings: caps.supportsEmbeddings,
        supportsVision: caps.supportsVision,
        contextLength: model.context_length ?? caps.contextLength,
      })
      .onConflictDoUpdate({
        target: [aiModels.providerId, aiModels.modelId],
        set: {
          displayName: sql`excluded.display_name`,
          supportsChat: sql`excluded.supports_chat`,
          supportsResponses: sql`excluded.supports_responses`,
          supportsEmbeddings: sql`excluded.supports_embeddings`,
          supportsVision: sql`excluded.supports_vision`,
          contextLength: sql`excluded.context_length`,
        },
      });

    discovered.push({
      modelId: model.id,
      ...caps,
      contextLength: model.context_length ?? caps.contextLength,
    });
  }

  return discovered;
}
