'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';

interface SearchResult {
  type: string;
  title: string;
  slug: string;
  collection?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    router.push(`/blog/${result.slug}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--bd-default)',
          }}
        >
          <Icon name="search" size={16} style={{ color: 'var(--tx-3)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs, tutorials, cheatsheets..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--tx-1)',
              fontSize: 15,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '2px 6px',
              background: 'var(--bg-3)',
              border: '1px solid var(--bd-default)',
              borderRadius: 4,
              color: 'var(--tx-3)',
            }}
          >
            esc
          </kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--tx-3)',
                fontSize: 14,
              }}
            >
              Searching...
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--tx-3)',
                fontSize: 14,
              }}
            >
              No results for &quot;{query}&quot;
            </div>
          )}
          {!loading &&
            results.map((r, i) => (
              <div
                key={i}
                onClick={() => navigate(r)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--bd-subtle)',
                  transition: 'background .1s',
                }}
              >
                <Icon
                  name={r.type === 'cheatsheet' ? 'list' : 'book'}
                  size={15}
                  style={{ color: 'var(--tx-3)', flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: 14, color: 'var(--tx-1)' }}>{r.title}</span>
                {r.collection && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--tx-3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {r.collection}
                  </span>
                )}
              </div>
            ))}
          {!loading && !query && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--tx-3)',
                fontSize: 14,
              }}
            >
              Start typing to search...
            </div>
          )}
        </div>
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: 'var(--tx-3)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>&#8593;&#8595; navigate</span>
          <span>&#8629; open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
