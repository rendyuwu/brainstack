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
  await db.insert(aiUsageLogs).values(data);
}
