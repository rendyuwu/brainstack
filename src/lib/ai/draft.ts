import { db } from '@/db';
import { aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from './client';
import { logAIUsage } from './usage-logger';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from './types';

const SYSTEM_PROMPT = `You are Noa, an AI writing assistant for BrainStack — an IT knowledge platform for DevOps, cloud, and infrastructure topics.

Generate a well-structured MDX tutorial based on the user's idea. Follow these rules:

1. Start with a clear, concise title as an H1 heading (# Title)
2. Include an introductory paragraph explaining what the reader will learn
3. Use H2 (##) for major sections and H3 (###) for subsections
4. Include practical code blocks with language tags (e.g. \`\`\`bash, \`\`\`yaml, \`\`\`typescript)
5. Use callouts for important notes: <Callout type="info|warning|tip">content</Callout>
6. Include a "Prerequisites" section if relevant
7. End with a "Summary" or "Next Steps" section
8. Keep explanations concise and technical — this audience knows the basics
9. Use real-world examples, not toy demos
10. Output valid MDX only — no frontmatter, no imports`;

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

export async function generateDraft(
  idea: string,
  options?: { imageUrl?: string }
): Promise<ReadableStream<Uint8Array>> {
  const { provider, modelId } = await findChatProvider();
  const client = createAIClient(provider);

  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'text', text: `Write a tutorial about: ${idea}` }];

  if (options?.imageUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: options.imageUrl },
    });
  }

  const stream = await client.chat.completions.create({
    model: modelId,
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const encoder = new TextEncoder();
  const startTime = Date.now();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let inputTokens: number | undefined;
        let outputTokens: number | undefined;

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens;
            outputTokens = chunk.usage.completion_tokens;
          }
        }

        controller.close();

        logAIUsage({
          providerId: provider.id,
          modelId,
          endpoint: 'draft',
          inputTokens,
          outputTokens,
          durationMs: Date.now() - startTime,
        }).catch(() => {});
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
