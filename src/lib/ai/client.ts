import OpenAI from 'openai';
import type { ProviderConfig } from './types';

export function createAIClient(provider: ProviderConfig): OpenAI {
  return new OpenAI({
    baseURL: provider.baseUrl,
    apiKey: provider.apiKeySecretRef || '',
    defaultHeaders: provider.defaultHeaders || undefined,
  });
}
