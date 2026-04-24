import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from './client';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from './types';

const STYLE_PROMPTS: Record<string, string> = {
  cheatsheet: `You are Noa, an AI writing assistant for BrainStack.

Rewrite the following content as a concise cheatsheet format:
- Use short, scannable sections with H2 headings
- Replace prose with bullet points and tables where possible
- Keep all code examples but remove surrounding explanation fluff
- Use a "Quick Reference" style — assume the reader already understands the concepts
- Group related commands/concepts together
- Output valid MDX only — no frontmatter, no imports`,

  beginner: `You are Noa, an AI writing assistant for BrainStack.

Rewrite the following content for absolute beginners:
- Expand explanations and avoid jargon (or define it when first used)
- Add more context before code blocks explaining what the code does
- Break complex steps into smaller substeps
- Add <Callout type="tip"> blocks for common gotchas
- Include expected output after commands when helpful
- Keep the same overall structure but make it more approachable
- Output valid MDX only — no frontmatter, no imports`,

  advanced: `You are Noa, an AI writing assistant for BrainStack.

Rewrite the following content for advanced practitioners:
- Remove basic explanations — get straight to the point
- Add production-grade considerations (security, performance, scaling)
- Include edge cases and error handling
- Reference official docs or RFCs where relevant
- Add advanced configuration options and tuning tips
- Use more sophisticated code examples with proper error handling
- Output valid MDX only — no frontmatter, no imports`,
};

async function findChatProvider(): Promise<{
  provider: ProviderConfig;
  modelId: string;
}> {
  const providers = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.enabled, true));

  for (const row of providers) {
    const models = await db
      .select()
      .from(aiModels)
      .where(
        and(eq(aiModels.providerId, row.id), eq(aiModels.supportsChat, true))
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

  throw new Error(
    'No AI provider with a chat-capable model is configured. Go to Admin > AI Providers to add one.'
  );
}

export type RewriteStyle = 'cheatsheet' | 'beginner' | 'advanced';

export async function rewriteContent(
  content: string,
  style: RewriteStyle
): Promise<ReadableStream<Uint8Array>> {
  const { provider, modelId } = await findChatProvider();
  const client = createAIClient(provider);

  const systemPrompt = STYLE_PROMPTS[style];
  if (!systemPrompt) {
    throw new Error(`Unknown rewrite style: ${style}`);
  }

  const stream = await client.chat.completions.create({
    model: modelId,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Rewrite the following content:\n\n${content}`,
      },
    ],
    temperature: 0.6,
    max_tokens: 4096,
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
