import { chatWithFallback } from './find-chat-model';
import { logAIUsage } from './usage-logger';

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

export type RewriteStyle = 'cheatsheet' | 'beginner' | 'advanced';

export async function rewriteContent(
  content: string,
  style: RewriteStyle
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = STYLE_PROMPTS[style];
  if (!systemPrompt) {
    throw new Error(`Unknown rewrite style: ${style}`);
  }

  const { stream, provider, modelId } = await chatWithFallback(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Rewrite the following content:\n\n${content}` },
    ],
    { temperature: 0.6, max_tokens: 4096 },
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
          endpoint: 'rewrite',
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
