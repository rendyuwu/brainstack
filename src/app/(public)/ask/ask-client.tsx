'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons';
import { MessageBubble } from '@/components/chat/message-bubble';
import { CitationList, type ChatCitation } from '@/components/chat/citation-list';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
}

interface AskPageClientProps {
  suggestedQuestions: string[];
}

export function AskPageClient({ suggestedQuestions }: AskPageClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      citations: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          scopeType: 'site',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let metaParsed = false;
      let citations: ChatCitation[] = [];
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (!metaParsed && buffer.includes('\n')) {
          const newlineIdx = buffer.indexOf('\n');
          const firstLine = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          try {
            const meta = JSON.parse(firstLine);
            if (meta.type === 'meta') {
              setConversationId(meta.conversationId);
              citations = meta.citations || [];
            }
          } catch {
            buffer = firstLine + buffer;
          }
          metaParsed = true;
        }

        if (metaParsed) {
          fullText += buffer;
          buffer = '';

          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant') {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: fullText,
                citations,
              };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'assistant') {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: `Error: ${(err as Error).message}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          minHeight: 0,
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 60,
              gap: 24,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--teal-bg)',
                border: '1px solid var(--teal-bd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="sparkles" size={24} style={{ color: 'var(--teal)' }} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--tx-2)',
                  marginBottom: 8,
                }}
              >
                What would you like to know?
              </div>
              <div style={{ fontSize: 13, color: 'var(--tx-3)', lineHeight: 1.5 }}>
                I can answer questions about any article in BrainStack, with citations to the source material.
              </div>
            </div>

            {/* Suggested questions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                maxWidth: 560,
                marginTop: 8,
              }}
            >
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    border: '1px solid var(--bd-default)',
                    background: 'var(--bg-2)',
                    color: 'var(--tx-2)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'border-color .15s, color .15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && msg.role === 'assistant' && !msg.content}
            />
            {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && msg.content && (
              <CitationList citations={msg.citations} />
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid var(--bd-default)',
          padding: '14px 32px',
          background: 'var(--bg-2)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: 700, margin: '0 auto' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about DevOps, cloud, infrastructure..."
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid var(--bd-strong)',
              borderRadius: 10,
              padding: '10px 14px',
              background: 'var(--bg-1)',
              color: 'var(--tx-1)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              outline: 'none',
              minHeight: 42,
              maxHeight: 120,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: 'none',
              background: input.trim() && !isStreaming ? 'var(--teal)' : 'var(--bg-3)',
              color: input.trim() && !isStreaming ? 'var(--bg-0)' : 'var(--tx-3)',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .15s',
            }}
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
