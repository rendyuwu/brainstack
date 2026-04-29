import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { createAIClient } from './client';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from './types';
import { isDiscoveryMode, isProviderKind } from './types';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';

// ---------- helpers ----------

function decryptApiKey(stored: string | null): string | null {
  if (!stored) return null;
  try {
    // §V.41: decrypt if encrypted, pass through if plaintext (migration compat)
    return isEncrypted(stored) ? decrypt(stored) : stored;
  } catch {
    console.warn('Failed to decrypt API key — returning as-is (may be plaintext)');
    return stored;
  }
}

function rowToProviderConfig(row: typeof aiProviders.$inferSelect): ProviderConfig {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind as ProviderKind,
    baseUrl: row.baseUrl,
    apiKeySecretRef: decryptApiKey(row.apiKeySecretRef),
    defaultHeaders: (row.defaultHeaders as Record<string, string>) ?? null,
    discoveryMode: row.discoveryMode as DiscoveryMode,
    enabled: row.enabled,
  };
}

// ---------- CRUD ----------

export async function getProviders() {
  const rows = await db.select().from(aiProviders).orderBy(aiProviders.label);

  if (rows.length === 0) return [];

  // §V.54: filter models by provider IDs instead of loading entire table
  const providerIds = rows.map((r) => r.id);
  const models = await db
    .select()
    .from(aiModels)
    .where(inArray(aiModels.providerId, providerIds));

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
  if (!isProviderKind(data.kind)) {
    throw new Error('Invalid provider kind');
  }
  if (data.discoveryMode !== undefined && !isDiscoveryMode(data.discoveryMode)) {
    throw new Error('Invalid discovery mode');
  }

  const [row] = await db
    .insert(aiProviders)
    .values({
      label: data.label,
      kind: data.kind,
      baseUrl: data.baseUrl,
      apiKeySecretRef: data.apiKeySecretRef ? encrypt(data.apiKeySecretRef) : null,
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
  if (data.kind !== undefined && !isProviderKind(data.kind)) {
    throw new Error('Invalid provider kind');
  }
  if (data.discoveryMode !== undefined && !isDiscoveryMode(data.discoveryMode)) {
    throw new Error('Invalid discovery mode');
  }

  const updates: Record<string, unknown> = {};
  if (data.label !== undefined) updates.label = data.label;
  if (data.kind !== undefined) updates.kind = data.kind;
  if (data.baseUrl !== undefined) updates.baseUrl = data.baseUrl;
  if (data.apiKeySecretRef !== undefined) {
    // Skip if value looks like a masked key (contains consecutive *'s) — prevents
    // overwriting real key with masked placeholder from GET/PUT response
    const isMasked = data.apiKeySecretRef && /\*{3,}/.test(data.apiKeySecretRef);
    if (!isMasked) {
      updates.apiKeySecretRef = data.apiKeySecretRef ? encrypt(data.apiKeySecretRef) : null;
    }
  }
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

// ---------- manual model management ----------

export async function addManualModel(
  providerId: string,
  data: {
    modelId: string;
    supportsChat?: boolean;
    supportsEmbeddings?: boolean;
    supportsVision?: boolean;
    supportsResponses?: boolean;
    contextLength?: number | null;
  },
) {
  const [row] = await db
    .insert(aiModels)
    .values({
      providerId,
      modelId: data.modelId,
      displayName: data.modelId,
      supportsChat: data.supportsChat ?? true,
      supportsResponses: data.supportsResponses ?? false,
      supportsEmbeddings: data.supportsEmbeddings ?? false,
      supportsVision: data.supportsVision ?? false,
      contextLength: data.contextLength ?? null,
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
    })
    .returning();

  return row;
}

export async function testModel(provider: ProviderConfig, modelId: string) {
  try {
    const client = createAIClient(provider);
    await client.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    });
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

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

// ---------- capability detection ----------

interface CapabilityPattern {
  pattern: RegExp;
  supportsResponses?: boolean;
  supportsEmbeddings?: boolean;
  supportsVision?: boolean;
}

/**
 * Configurable capability patterns — extend this array when new model
 * families are added instead of scattering `.includes()` checks.
 */
const CAPABILITY_PATTERNS: CapabilityPattern[] = [
  // OpenAI
  { pattern: /gpt-4o/,            supportsResponses: true, supportsVision: true },
  { pattern: /gpt-4/,             supportsResponses: true },
  { pattern: /gpt-3\.5/,          supportsResponses: true },
  { pattern: /o[1-9]/,            supportsResponses: true, supportsVision: true },
  // Anthropic
  { pattern: /claude-3/,          supportsVision: true },
  { pattern: /claude-4/,          supportsVision: true },
  // Google
  { pattern: /gemini/,            supportsVision: true },
  // Embeddings
  { pattern: /embed/,             supportsEmbeddings: true },
  // Vision keyword
  { pattern: /vision/,            supportsVision: true },
];

export function detectCapabilities(modelId: string) {
  const id = modelId.toLowerCase();

  const caps = {
    supportsChat: true,
    supportsResponses: false,
    supportsEmbeddings: false,
    supportsVision: false,
    contextLength: null as number | null,
  };

  for (const rule of CAPABILITY_PATTERNS) {
    if (rule.pattern.test(id)) {
      if (rule.supportsResponses) caps.supportsResponses = true;
      if (rule.supportsEmbeddings) caps.supportsEmbeddings = true;
      if (rule.supportsVision) caps.supportsVision = true;
    }
  }

  return caps;
}

export async function discoverModels(provider: ProviderConfig) {
  const client = createAIClient(provider);

  let modelsEndpoint: string;
  if (provider.discoveryMode === 'static') {
    return [];
  } else if (provider.discoveryMode === 'openrouter-models') {
    modelsEndpoint = '/api/v1/models';
  } else if (provider.discoveryMode === 'litellm-model-info') {
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
