import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages, aiProviders, aiModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAIClient } from '@/lib/ai/client';
import { hybridSearch } from '@/lib/rag/search';
import type { ProviderConfig, ProviderKind, DiscoveryMode } from '@/lib/ai/types';

interface ChatRequestBody {
  message: string;
  conversationId?: string;
  scopeType: 'page' | 'collection' | 'site';
  scopeId?: string;
}

interface Citation {
  num: number;
  pageTitle: string;
  pageSlug: string;
  anchorId: string | null;
  content: string;
}

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

  throw new Error('No AI provider with a chat-capable model is configured.');
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
  try {
    const body = (await request.json()) as ChatRequestBody;
    const { message, conversationId, scopeType, scopeId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // 1. Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const [conv] = await db
        .insert(conversations)
        .values({
          scopeType: scopeType || 'site',
          scopeId: scopeId || null,
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
      scopeId,
      limit: 6,
    });

    // 4. Build context
    const citations: Citation[] = searchResults.map((r, i) => ({
      num: i + 1,
      pageTitle: r.pageTitle,
      pageSlug: r.pageSlug,
      anchorId: r.anchorId,
      content: r.content,
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

    // 5. Stream AI response
    const { provider, modelId } = await findChatProvider();
    const client = createAIClient(provider);

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

    const stream = await client.chat.completions.create({
      model: modelId,
      stream: true,
      messages: chatMessages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    // 6. Stream response and collect full text
    const encoder = new TextEncoder();
    let fullResponse = '';

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
            })),
          });
          controller.enqueue(encoder.encode(meta + '\n'));

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              controller.enqueue(encoder.encode(delta));
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
            })),
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
