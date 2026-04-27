import { chatWithFallback } from './find-chat-model';
import { logAIUsage } from './usage-logger';

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

export async function generateDraft(
  idea: string,
  options?: { imageUrl?: string }
): Promise<ReadableStream<Uint8Array>> {
  const userContent = `Write a tutorial about: ${idea}${
    options?.imageUrl ? `\n\n[Reference image: ${options.imageUrl}]` : ''
  }`;

  const { stream, provider, modelId } = await chatWithFallback(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    { temperature: 0.7, max_tokens: 4096 },
  );

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
        });
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
