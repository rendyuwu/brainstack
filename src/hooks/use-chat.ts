'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatCitation } from '@/components/chat/citation-list';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
}

export interface UseChatOptions {
  scopeType: 'page' | 'collection' | 'site';
  scopeId?: string;
}

export function useChat({ scopeType, scopeId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setInput('');
      setIsStreaming(true);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };
      const assistantMsg: ChatMessage = {
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
            message: trimmed,
            ...(conversationId ? { conversationId } : {}),
            scopeType,
            ...(scopeId ? { scopeId } : {}),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
          const detail = err.details
            ? `: ${err.details.map((d: { path?: string[]; message?: string }) => `${d.path?.join('.') || '?'} — ${d.message}`).join('; ')}`
            : '';
          throw new Error((err.error || 'Chat request failed') + detail);
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
    },
    [isStreaming, conversationId, scopeType, scopeId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input]
  );

  return {
    messages,
    input,
    setInput,
    isStreaming,
    sendMessage,
    handleKeyDown,
    scrollRef,
  };
}
