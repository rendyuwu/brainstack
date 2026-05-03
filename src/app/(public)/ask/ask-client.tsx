'use client';

import { useRef } from 'react';
import { Icon } from '@/components/icons';
import { ChatMessages } from '@/components/chat/chat-messages';
import styles from './ask-client.module.css';
import { useChat } from '@/hooks/use-chat';

interface AskPageClientProps {
  suggestedQuestions: string[];
}

export function AskPageClient({ suggestedQuestions }: AskPageClientProps) {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    sendMessage,
    handleKeyDown,
    scrollRef,
  } = useChat({ scopeType: 'site' });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className={styles.messagesArea}
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

        <ChatMessages messages={messages} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Input */}
      <div className={styles.inputBar}>
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
