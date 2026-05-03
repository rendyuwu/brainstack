'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { ChatPanel } from './chat-panel';

interface ArticleChatToggleProps {
  pageId: string;
}

export function ArticleChatToggle({ pageId }: ArticleChatToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          zIndex: 101,
          padding: '5px 12px',
          borderRadius: 6,
          background: isOpen ? 'var(--teal-bg)' : 'var(--bg-2)',
          border: `1px solid ${isOpen ? 'var(--teal-bd)' : 'var(--bd-default)'}`,
          color: isOpen ? 'var(--teal)' : 'var(--tx-2)',
          fontSize: 12.5,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all .15s',
        }}
      >
        <Icon name="sparkles" size={12} />
        Ask this post
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 52,
            right: 0,
            bottom: 0,
            width: 380,
            background: 'var(--bg-1)',
            borderLeft: '1px solid var(--bd-default)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideIn .2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--bd-default)',
              background: 'var(--bg-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="sparkles" size={14} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-1)' }}>
                Ask this post
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                color: 'var(--tx-3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
          <ChatPanel
            scopeType="page"
            scopeId={pageId}
            placeholder="Ask about this article..."
          />
        </div>
      )}
    </>
  );
}
