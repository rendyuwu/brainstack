'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';
import { useTheme } from './theme-provider';

/* ── Types ──────────────────────────────────────────────── */

interface SearchResult {
  type: string;
  title: string;
  slug: string;
  collection?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/* ── Fuzzy match ────────────────────────────────────────── */

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

/* ── Component ──────────────────────────────────────────── */

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toggleTheme } = useTheme();

  /* ── Quick actions ──────────────────────────────────── */

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'nav-discover',
        label: 'Go to Discover',
        icon: 'home',
        action: () => { router.push('/discover'); onClose(); },
      },
      {
        id: 'nav-blog',
        label: 'Go to Articles',
        icon: 'book',
        action: () => { router.push('/blog'); onClose(); },
      },
      {
        id: 'nav-cheatsheets',
        label: 'Go to Cheatsheets',
        icon: 'list',
        action: () => { router.push('/cheatsheets'); onClose(); },
      },
      {
        id: 'nav-ask',
        label: 'Ask AI',
        icon: 'sparkles',
        action: () => { router.push('/ask'); onClose(); },
      },
      {
        id: 'nav-editor',
        label: 'Go to Editor',
        icon: 'wand',
        action: () => { router.push('/editor'); onClose(); },
      },
      {
        id: 'nav-admin',
        label: 'Go to Admin',
        icon: 'shield',
        action: () => { router.push('/admin'); onClose(); },
      },
      {
        id: 'new-page',
        label: 'New Page',
        icon: 'plus',
        shortcut: '⌘N',
        action: () => { router.push('/editor/new'); onClose(); },
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Theme',
        icon: 'moon',
        action: () => { toggleTheme(); onClose(); },
      },
      {
        id: 'search-ai',
        label: 'Search with AI',
        icon: 'sparkles',
        shortcut: '⌘/',
        action: () => { router.push('/ask'); onClose(); },
      },
    ],
    [router, onClose, toggleTheme]
  );

  /* ── Filtered quick actions ─────────────────────────── */

  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    return quickActions.filter((a) => fuzzyMatch(a.label, query));
  }, [query, quickActions]);

  /* ── Combined items for keyboard nav ────────────────── */

  const totalItems = filteredActions.length + results.length;

  /* ── Reset on open ──────────────────────────────────── */

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── Escape to close ────────────────────────────────── */

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, open]);

  /* ── API search (debounced) ─────────────────────────── */

  const search = useCallback(async (q: string) => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  /* ── Reset selection when items change ──────────────── */

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filteredActions.length, results.length]);

  /* ── Keyboard navigation ────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(totalItems, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex < filteredActions.length) {
          filteredActions[selectedIndex].action();
        } else {
          const resultIdx = selectedIndex - filteredActions.length;
          if (results[resultIdx]) {
            navigateResult(results[resultIdx]);
          }
        }
      }
    },
    [totalItems, selectedIndex, filteredActions, results]
  );

  /* ── Scroll selected into view ──────────────────────── */

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  /* ── Navigate to search result ──────────────────────── */

  const navigateResult = (result: SearchResult) => {
    const prefix = result.type === 'cheatsheet' ? '/cheatsheets' : '/blog';
    router.push(`${prefix}/${result.slug}`);
    onClose();
  };

  if (!open) return null;

  /* ── Styles ─────────────────────────────────────────── */

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background .1s',
    fontSize: 14,
  };

  const selectedBg = 'var(--bg-3)';

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
        animation: 'fadeIn .15s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
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
        {/* ── Search input ──────────────────────────────── */}
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
            placeholder="Type a command or search..."
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

        {/* ── Results list ──────────────────────────────── */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto' }}>
          {/* Quick actions section */}
          {filteredActions.length > 0 && (
            <>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tx-3)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {query ? 'Actions' : 'Quick Actions'}
              </div>
              {filteredActions.map((action, i) => (
                <div
                  key={action.id}
                  data-idx={i}
                  onClick={() => action.action()}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    ...itemBase,
                    background: selectedIndex === i ? selectedBg : 'transparent',
                    color: 'var(--tx-1)',
                  }}
                >
                  <Icon
                    name={action.icon}
                    size={15}
                    style={{
                      color: selectedIndex === i ? 'var(--amber)' : 'var(--tx-3)',
                      flexShrink: 0,
                      transition: 'color .1s',
                    }}
                  />
                  <span style={{ flex: 1 }}>{action.label}</span>
                  {action.shortcut && (
                    <kbd
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        padding: '2px 6px',
                        background: 'var(--bg-4)',
                        border: '1px solid var(--bd-default)',
                        borderRadius: 4,
                        color: 'var(--tx-3)',
                      }}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Search results section */}
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

          {!loading && query && results.length > 0 && (
            <>
              <div
                style={{
                  padding: '8px 16px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tx-3)',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  borderTop: filteredActions.length > 0 ? '1px solid var(--bd-subtle)' : 'none',
                }}
              >
                Search Results
              </div>
              {results.map((r, i) => {
                const idx = filteredActions.length + i;
                return (
                  <div
                    key={`result-${i}`}
                    data-idx={idx}
                    onClick={() => navigateResult(r)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      ...itemBase,
                      background: selectedIndex === idx ? selectedBg : 'transparent',
                      color: 'var(--tx-1)',
                    }}
                  >
                    <Icon
                      name={r.type === 'cheatsheet' ? 'list' : 'book'}
                      size={15}
                      style={{
                        color: selectedIndex === idx ? 'var(--amber)' : 'var(--tx-3)',
                        flexShrink: 0,
                        transition: 'color .1s',
                      }}
                    />
                    <span style={{ flex: 1 }}>{r.title}</span>
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
                );
              })}
            </>
          )}

          {!loading && query && results.length === 0 && filteredActions.length === 0 && (
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
        </div>

        {/* ── Footer hints ──────────────────────────────── */}
        <div
          style={{
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: 'var(--tx-3)',
            fontFamily: 'var(--font-mono)',
            borderTop: '1px solid var(--bd-subtle)',
          }}
        >
          <span>&#8593;&#8595; navigate</span>
          <span>&#8629; select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
