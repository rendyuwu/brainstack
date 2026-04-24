'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/icons';
import { MessageBubble } from './message-bubble';
import { CitationList, type ChatCitation } from './citation-list';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
}

interface ChatPanelProps {
  scopeType: 'page' | 'collection' | 'site';
  scopeId?: string;
  placeholder?: string;
}

export function ChatPanel({
  scopeType,
  scopeId,
  placeholder = 'Ask a question...',
}: ChatPanelProps) {
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

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    // Add placeholder assistant message
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
          scopeType,
          scopeId,
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

        // Parse meta line (first line)
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
            // Not JSON meta line, treat as content
            buffer = firstLine + buffer;
          }
          metaParsed = true;
        }

        // Stream content
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
  }, [input, isStreaming, conversationId, scopeType, scopeId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-1)',
      }}
    >
      {/* Messages area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          minHeight: 0,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--tx-3)',
              textAlign: 'center',
              padding: 20,
            }}
          >
            <Icon name="sparkles" size={32} style={{ color: 'var(--teal)', opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>Ask me anything about the knowledge base</div>
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

      {/* Input area */}
      <div
        style={{
          borderTop: '1px solid var(--bd-default)',
          padding: '12px 16px',
          background: 'var(--bg-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid var(--bd-strong)',
              borderRadius: 8,
              padding: '10px 12px',
              background: 'var(--bg-1)',
              color: 'var(--tx-1)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              outline: 'none',
              minHeight: 40,
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background:
                input.trim() && !isStreaming
                  ? 'var(--teal)'
                  : 'var(--bg-3)',
              color:
                input.trim() && !isStreaming
                  ? 'var(--bg-0)'
                  : 'var(--tx-3)',
              cursor:
                input.trim() && !isStreaming ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .15s, color .15s',
            }}
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
