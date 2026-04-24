'use client';

import { useState, useRef } from 'react';

interface AIAssistPanelProps {
  content: string;
  onContentGenerated: (text: string) => void;
}

type RewriteStyle = 'cheatsheet' | 'beginner' | 'advanced';

const REWRITE_BUTTONS: { label: string; style: RewriteStyle }[] = [
  { label: 'Rewrite article → cheatsheet', style: 'cheatsheet' },
  { label: 'Expand outline into full post', style: 'advanced' },
  { label: 'Simplify for beginners', style: 'beginner' },
];

async function readStream(
  response: Response,
  onChunk: (text: string) => void,
  signal: AbortSignal,
) {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }
}

export default function AIAssistPanel({ content, onContentGenerated }: AIAssistPanelProps) {
  const [activeTab, setActiveTab] = useState<'draft' | 'iterate'>('draft');
  const [ideaInput, setIdeaInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  async function handleDraft() {
    if (!ideaInput.trim() || streaming) return;
    setError('');
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaInput.trim() }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await readStream(res, (chunk) => {
        accumulated += chunk;
        onContentGenerated(accumulated);
      }, controller.signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function handleRewrite(style: RewriteStyle) {
    if (!content.trim() || streaming) return;
    setError('');
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, style }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await readStream(res, (chunk) => {
        accumulated += chunk;
        onContentGenerated(accumulated);
      }, controller.signal);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        borderLeft: '1px solid var(--bd-default)',
        background: 'var(--bg-1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--bd-default)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--teal-bg)',
              border: '1px solid var(--teal-bd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: 'var(--teal)',
            }}
          >
            *
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tx-1)' }}>
            AI Assist
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            {(['draft', 'iterate'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--bg-3)' : 'none',
                  border: `1px solid ${activeTab === tab ? 'var(--bd-strong)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--tx-1)' : 'var(--tx-3)',
                  fontSize: 12,
                  fontWeight: activeTab === tab ? 500 : 400,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(248,81,73,.1)',
            border: '1px solid rgba(248,81,73,.3)',
            color: 'var(--red)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Draft tab */}
      {activeTab === 'draft' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <p
            style={{
              fontSize: 13,
              color: 'var(--tx-2)',
              marginBottom: 14,
              lineHeight: 1.55,
            }}
          >
            Describe your post idea and AI will generate a full draft
            — title, structure, code examples, and all.
          </p>

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="e.g. Docker volumes and persistent storage — how to create, mount, and manage volumes"
              rows={4}
              disabled={streaming}
              style={{
                width: '100%',
                background: 'var(--bg-0)',
                border: '1px solid var(--bd-default)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--tx-1)',
                fontSize: 13.5,
                fontFamily: 'var(--font-sans)',
                resize: 'vertical',
                lineHeight: 1.55,
                outline: 'none',
                boxSizing: 'border-box',
                opacity: streaming ? 0.6 : 1,
              }}
            />
          </div>

          {streaming ? (
            <button
              onClick={cancel}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 7,
                background: 'var(--red)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Stop generating
            </button>
          ) : (
            <button
              onClick={handleDraft}
              disabled={!ideaInput.trim()}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 7,
                background: ideaInput.trim() ? 'var(--teal)' : 'var(--bg-3)',
                border: 'none',
                color: ideaInput.trim() ? '#000' : 'var(--tx-3)',
                cursor: ideaInput.trim() ? 'pointer' : 'default',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all .15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Generate draft
            </button>
          )}

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--tx-3)',
                marginBottom: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              Or try a rewrite tool
            </div>
            {REWRITE_BUTTONS.map(({ label, style }) => (
              <button
                key={style}
                onClick={() => handleRewrite(style)}
                disabled={!content.trim() || streaming}
                style={{
                  width: '100%',
                  textAlign: 'left' as const,
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginBottom: 6,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--bd-default)',
                  color: content.trim() && !streaming ? 'var(--tx-2)' : 'var(--tx-3)',
                  cursor: content.trim() && !streaming ? 'pointer' : 'default',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-sans)',
                  transition: 'color .15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Iterate tab */}
      {activeTab === 'iterate' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {content && (
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--bd-subtle)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--tx-3)',
                  marginBottom: 8,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                Quick rewrites
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {REWRITE_BUTTONS.map(({ label, style }) => (
                  <button
                    key={style}
                    onClick={() => handleRewrite(style)}
                    disabled={streaming}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 20,
                      background: 'var(--bg-2)',
                      border: '1px solid var(--bd-default)',
                      color: streaming ? 'var(--tx-3)' : 'var(--tx-2)',
                      cursor: streaming ? 'default' : 'pointer',
                      fontSize: 12,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                padding: '20px 0',
                textAlign: 'center',
                color: 'var(--tx-3)',
              }}
            >
              <p style={{ fontSize: 13 }}>
                Use the quick rewrite chips above, or switch to the Draft tab
                to generate new content from an idea.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
