import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { chatWithFallback } from '@/lib/ai/find-chat-model';
import { hybridSearch } from '@/lib/rag/search';
import { checkRateLimit } from '@/lib/rate-limiter';
import { logAIUsage } from '@/lib/ai/usage-logger';
import { chatSchema, validateBody } from '@/lib/validation';
import { auth } from '@/lib/auth';
import { contentSnippet } from '@/lib/content-snippet';

interface Citation {
  num: number;
  pageTitle: string;
  pageSlug: string;
  anchorId: string | null;
  content: string;
  contentSnippet: string;
}

const CHAT_SYSTEM_PROMPT = `You are Noa, an AI assistant for BrainStack — an IT knowledge base covering DevOps, cloud, and infrastructure.

Answer the user's question based ONLY on the provided context chunks. Follow these rules:

1. Include citation references like [1], [2], etc. when referencing information from specific chunks
2. If the provided context doesn't contain enough evidence to answer, say so honestly
3. Be concise and technical — the audience is IT professionals
4. Use code blocks when showing commands or configuration
5. If multiple chunks provide conflicting info, note the discrepancy
6. Never make up information not present in the context`;

export async function POST(request: NextRequest) {
  // Tighter rate limit for unauthenticated users (cost protection)
  const session = await auth();
  const limit = session ? 30 : 5;
  const rateCheck = checkRateLimit(request, limit, 60_000);
  if (!rateCheck.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(rateCheck.retryAfter) },
    });
  }

  try {
    const body = await request.json();
    const v = validateBody(chatSchema, body);
    if (!v.success) return v.response;
    const { message, conversationId, scopeType, scopeId } = v.data;

    // 1. Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const [conv] = await db
        .insert(conversations)
        .values({
          scopeType: scopeType || 'site',
          scopeId: scopeId ?? null,
        })
        .returning({ id: conversations.id });
      convId = conv.id;
    }

    // 2. Save user message
    await db.insert(messages).values({
      conversationId: convId,
      role: 'user',
      content: message,
    });

    // 3. Run hybrid search
    const searchResults = await hybridSearch(message, {
      scopeType,
      scopeId: scopeId ?? undefined,
      limit: 6,
    });

    // 4. Build context
    const citations: Citation[] = searchResults.map((r, i) => ({
      num: i + 1,
      pageTitle: r.pageTitle,
      pageSlug: r.pageSlug,
      anchorId: r.anchorId,
      content: r.content,
      contentSnippet: contentSnippet(r.content),
    }));

    const contextText = citations
      .map(
        (c) =>
          `[${c.num}] (${c.pageTitle})\n${c.content}`
      )
      .join('\n\n---\n\n');

    const userPrompt = contextText
      ? `Context chunks:\n\n${contextText}\n\n---\n\nUser question: ${message}`
      : `No relevant context was found in the knowledge base.\n\nUser question: ${message}`;

    // 5. Stream AI response with model fallback

    // Fetch conversation history for multi-turn
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    const chatMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [{ role: 'system', content: CHAT_SYSTEM_PROMPT }];

    // Include recent history (last 10 messages, excluding the one we just saved)
    const recentHistory = history.slice(-11, -1);
    for (const msg of recentHistory) {
      chatMessages.push({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      });
    }

    chatMessages.push({ role: 'user', content: userPrompt });

    const { stream, provider, modelId } = await chatWithFallback(chatMessages);

    // 6. Stream response and collect full text
    const encoder = new TextEncoder();
    let fullResponse = '';
    const startTime = Date.now();

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Send citations metadata first as a JSON line
          const meta = JSON.stringify({
            type: 'meta',
            conversationId: convId,
            citations: citations.map((c) => ({
              num: c.num,
              pageTitle: c.pageTitle,
              pageSlug: c.pageSlug,
              anchorId: c.anchorId,
              contentSnippet: c.contentSnippet,
            })),
          });
          controller.enqueue(encoder.encode(meta + '\n'));

          let inputTokens: number | undefined;
          let outputTokens: number | undefined;

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              controller.enqueue(encoder.encode(delta));
            }
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens;
              outputTokens = chunk.usage.completion_tokens;
            }
          }

          // Save assistant message with citations
          await db.insert(messages).values({
            conversationId: convId!,
            role: 'assistant',
            content: fullResponse,
            citations: citations.map((c) => ({
              num: c.num,
              pageTitle: c.pageTitle,
              pageSlug: c.pageSlug,
              anchorId: c.anchorId,
              contentSnippet: c.contentSnippet,
            })),
          });

          logAIUsage({
            providerId: provider.id,
            modelId,
            endpoint: 'chat',
            inputTokens,
            outputTokens,
            durationMs: Date.now() - startTime,
          });

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to process chat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
