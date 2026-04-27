import { db } from '@/db';
import { aiUsageLogs } from '@/db/schema';

export async function logAIUsage(data: {
  providerId?: string;
  modelId?: string;
  endpoint: 'draft' | 'rewrite' | 'chat' | 'embed';
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  userId?: string;
}) {
  try {
    await db.insert(aiUsageLogs).values(data);
  } catch (err) {
    console.warn(
      `[usage-logger] Failed to log AI usage (${data.endpoint}):`,
      err instanceof Error ? err.message : err
    );
  }
}
