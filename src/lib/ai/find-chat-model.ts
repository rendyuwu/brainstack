import OpenAI from 'openai';
import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from './client';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from './types';
import { decrypt, isEncrypted } from '@/lib/crypto';

export interface ChatCandidate {
  provider: ProviderConfig;
  modelId: string;
}

/** Decrypt API key if encrypted, pass through if plaintext (migration compat) */
function decryptApiKey(stored: string | null): string | null {
  if (!stored) return null;
  try {
    return isEncrypted(stored) ? decrypt(stored) : stored;
  } catch {
    return stored;
  }
}

/** Non-chat model ID patterns to skip */
const SKIP_PATTERNS = ['embed', 'tts', 'dall-e', 'image', 'FLUX'];

/**
 * Returns all chat-capable model candidates, filtering out
 * embedding/TTS/image models.
 */
export async function findChatCandidates(): Promise<ChatCandidate[]> {
  // Single JOIN query: providers + chat-capable models
  const rows = await db
    .select({
      providerId: aiProviders.id,
      label: aiProviders.label,
      kind: aiProviders.kind,
      baseUrl: aiProviders.baseUrl,
      apiKeySecretRef: aiProviders.apiKeySecretRef,
      defaultHeaders: aiProviders.defaultHeaders,
      discoveryMode: aiProviders.discoveryMode,
      enabled: aiProviders.enabled,
      modelId: aiModels.modelId,
    })
    .from(aiProviders)
    .innerJoin(
      aiModels,
      and(eq(aiModels.providerId, aiProviders.id), eq(aiModels.supportsChat, true))
    )
    .where(eq(aiProviders.enabled, true));

  const candidates: ChatCandidate[] = [];

  for (const row of rows) {
    if (SKIP_PATTERNS.some((p) => row.modelId.includes(p))) continue;

    candidates.push({
      provider: {
        id: row.providerId,
        label: row.label,
        kind: row.kind as ProviderKind,
        baseUrl: row.baseUrl,
        apiKeySecretRef: decryptApiKey(row.apiKeySecretRef),
        defaultHeaders:
          (row.defaultHeaders as Record<string, string>) ?? null,
        discoveryMode: row.discoveryMode as DiscoveryMode,
        enabled: row.enabled,
      },
      modelId: row.modelId,
    });
  }

  if (candidates.length === 0) {
    throw new Error(
      'No AI provider with a chat-capable model is configured. Go to Admin > AI Providers to add one.'
    );
  }

  return candidates;
}

/**
 * Try streaming chat completion with fallback across all candidates.
 * Returns the stream + which candidate succeeded.
 */
export async function chatWithFallback(
  chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  opts?: { temperature?: number; max_tokens?: number },
): Promise<{
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  provider: ProviderConfig;
  modelId: string;
}> {
  const candidates = await findChatCandidates();
  const errors: string[] = [];

  for (const candidate of candidates) {
    try {
      const client = createAIClient(candidate.provider);
      const response = await client.chat.completions.create({
        model: candidate.modelId,
        stream: true,
        messages: chatMessages,
        temperature: opts?.temperature ?? 0.3,
        max_tokens: opts?.max_tokens ?? 2048,
      });
      return {
        stream: response as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
        provider: candidate.provider,
        modelId: candidate.modelId,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${candidate.modelId}: ${msg}`);
      console.warn(`Chat model ${candidate.modelId} failed, trying next...`, msg);
    }
  }

  throw new Error(`All chat models failed: ${errors.join('; ')}`);
}
