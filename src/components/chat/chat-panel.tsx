'use client';

import { useRef } from 'react';
import { Icon } from '@/components/icons';
import { ChatMessages } from './chat-messages';
import { useChat } from '@/hooks/use-chat';

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
  const {
    messages,
    input,
    setInput,
    isStreaming,
    sendMessage,
    handleKeyDown,
    scrollRef,
  } = useChat({ scopeType, scopeId });
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

        <ChatMessages messages={messages} isStreaming={isStreaming} />
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
            onClick={() => sendMessage(input)}
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
