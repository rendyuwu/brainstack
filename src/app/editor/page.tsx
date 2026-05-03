'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  updatedAt: string;
  tags: string[];
}

const STATUS_COLORS: Record<string, string> = {
  published: 'var(--green, #22c55e)',
  draft: 'var(--amber, #f59e0b)',
  archived: 'var(--tx-3, #888)',
};

export default function EditorIndexPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    async function loadPages() {
      try {
        const res = await fetch('/api/pages');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setPages(data);
        }
      } catch (err) {
        console.error('Failed to load pages:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, [router]);

  const filtered = filter === 'all'
    ? pages
    : pages.filter((p) => p.status === filter);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div className={styles.topBar}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--tx-1)',
            margin: 0,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Articles
        </h1>
        <div style={{ flex: 1 }} />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-2)', borderRadius: 6, padding: 2 }}>
          {(['all', 'draft', 'published'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: 'none',
                background: filter === f ? 'var(--bg-1)' : 'transparent',
                color: filter === f ? 'var(--tx-1)' : 'var(--tx-3)',
                fontSize: 12,
                fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/editor/new')}
          style={{
            padding: '7px 16px',
            borderRadius: 6,
            background: 'var(--teal, #14b8a6)',
            border: 'none',
            color: '#000',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + New article
        </button>
      </div>

      {/* Article list */}
      <div className={styles.listArea}>
        {loading ? (
          <div style={{ color: 'var(--tx-3)', fontSize: 14, padding: 20, textAlign: 'center' }}>
            Loading articles...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--tx-3)', fontSize: 14, padding: 40, textAlign: 'center' }}>
            {filter === 'all' ? 'No articles yet. Create your first one!' : `No ${filter} articles.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((page) => (
              <button
                key={page.id}
                onClick={() => router.push(`/editor/${page.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'var(--bg-1)',
                  border: '1px solid var(--bd-subtle)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'background .1s',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-1)';
                }}
              >
                {/* Status dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_COLORS[page.status] || 'var(--tx-3)',
                    flexShrink: 0,
                  }}
                />

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--tx-1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {page.title || 'Untitled'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--tx-3)',
                      marginTop: 2,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{page.status}</span>
                    <span>·</span>
                    <span style={{ textTransform: 'capitalize' }}>{page.type}</span>
                    {page.updatedAt && (
                      <>
                        <span>·</span>
                        <span>
                          {new Date(page.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {page.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {page.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: 'var(--bg-3)',
                          color: 'var(--tx-2)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Arrow */}
                <span style={{ color: 'var(--tx-3)', fontSize: 14, flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
