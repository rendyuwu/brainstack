'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Tag } from '@/components/tag';

interface Article {
  id: string;
  title: string;
  slug: string;
  type: string;
  topic: string;
  topicLabel: string;
  color: string;
  mins: number;
  date: string;
  summary: string;
}

interface TopicFilter {
  id: string;
  label: string;
}

interface PageListClientProps {
  title: string;
  subtitle: string;
  articles: Article[];
  topicFilters: TopicFilter[];
  totalCount: number;
  basePath: string;
}

export function PageListClient({ title, subtitle, articles, topicFilters, basePath }: PageListClientProps) {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') ?? 'all';

  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState(initialTopic);
  const [sort, setSort] = useState('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filtered = articles
    .filter((a) => topicFilter === 'all' || a.topic === topicFilter)
    .filter(
      (a) =>
        !query ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.summary.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) =>
      sort === 'mins-asc'
        ? a.mins - b.mins
        : sort === 'mins-desc'
          ? b.mins - a.mins
          : 0
    );

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--tx-1)',
              margin: '0 0 4px',
              letterSpacing: '-.02em',
            }}
          >
            {title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: 0 }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-0)',
              border: '1px solid var(--bd-default)',
              borderRadius: 7,
              padding: '8px 12px',
            }}
          >
            <Icon name="search" size={14} style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by title or tag..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--tx-1)',
                fontSize: 14,
                fontFamily: 'var(--font-sans)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--tx-3)',
                  padding: 2,
                }}
              >
                <Icon name="close" size={13} />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              background: 'var(--bg-0)',
              border: '1px solid var(--bd-default)',
              borderRadius: 7,
              padding: '8px 12px',
              color: 'var(--tx-2)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="recent">Most recent</option>
            <option value="mins-asc">Shortest first</option>
            <option value="mins-desc">Longest first</option>
          </select>

          <div
            style={{
              display: 'flex',
              border: '1px solid var(--bd-default)',
              borderRadius: 7,
              overflow: 'hidden',
            }}
          >
            {(['list', 'grid'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 10px',
                  background: viewMode === mode ? 'var(--bg-3)' : 'var(--bg-0)',
                  border: 'none',
                  cursor: 'pointer',
                  color: viewMode === mode ? 'var(--tx-1)' : 'var(--tx-3)',
                  transition: 'all .1s',
                }}
              >
                <Icon name={mode === 'list' ? 'list' : 'layers'} size={14} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {topicFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setTopicFilter(f.id)}
              style={{
                padding: '5px 13px',
                borderRadius: 20,
                cursor: 'pointer',
                background: topicFilter === f.id ? 'var(--amber)' : 'var(--bg-2)',
                border: `1px solid ${topicFilter === f.id ? 'var(--amber)' : 'var(--bd-default)'}`,
                color: topicFilter === f.id ? '#000' : 'var(--tx-2)',
                fontSize: 13,
                fontWeight: topicFilter === f.id ? 600 : 400,
                transition: 'all .15s',
              }}
            >
              {f.label}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  opacity: 0.7,
                }}
              >
                {f.id === 'all'
                  ? articles.length
                  : articles.filter((a) => a.topic === f.id).length}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: 'var(--tx-3)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 16,
          }}
        >
          {filtered.length === 0
            ? 'No results'
            : `${filtered.length} article${filtered.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}${topicFilter !== 'all' ? ` in ${topicFilters.find((f) => f.id === topicFilter)?.label}` : ''}`}
        </div>

        {viewMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`${basePath}/${a.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all .1s',
                  textDecoration: 'none',
                }}
              >
                <Tag label={a.topicLabel} color={a.color} small />
                <span
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--tx-1)',
                    letterSpacing: '-.01em',
                  }}
                >
                  {a.title}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--tx-3)',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    width: 48,
                    textAlign: 'right',
                  }}
                >
                  {a.mins} min
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--tx-3)',
                    flexShrink: 0,
                    width: 52,
                    textAlign: 'right',
                  }}
                >
                  {a.date}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`${basePath}/${a.slug}`}
                style={{
                  padding: '16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--bd-default)',
                  transition: 'all .1s',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Tag label={a.topicLabel} color={a.color} small />
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--tx-3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {a.mins} min
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--tx-1)',
                    lineHeight: 1.4,
                    marginBottom: 10,
                    letterSpacing: '-.01em',
                  }}
                >
                  {a.title}
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--tx-3)',
            }}
          >
            <Icon
              name="search"
              size={32}
              style={{ display: 'block', margin: '0 auto 12px', opacity: 0.2 }}
            />
            <p style={{ fontSize: 15, marginBottom: 6 }}>
              No articles match your filters.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setTopicFilter('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--amber)',
                fontSize: 13,
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
