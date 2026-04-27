'use client';

import Link from 'next/link';

export interface ChatCitation {
  num: number;
  pageTitle: string;
  pageSlug: string;
  anchorId: string | null;
  contentSnippet: string;
}

interface CitationListProps {
  citations: ChatCitation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
        marginBottom: 12,
        paddingLeft: 38,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--tx-3)',
          fontWeight: 500,
          marginRight: 2,
        }}
      >
        Sources:
      </span>
      {citations.map((c) => {
        const href = c.anchorId
          ? `/blog/${c.pageSlug}#${c.anchorId}`
          : `/blog/${c.pageSlug}`;

        return (
          <Link
            key={c.num}
            href={href}
            title={c.contentSnippet}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 3,
              padding: '5px 8px',
              borderRadius: 4,
              background: 'var(--teal-bg)',
              border: '1px solid var(--teal-bd)',
              color: 'var(--teal)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              transition: 'background .15s',
              maxWidth: 260,
            }}
          >
            <span>[{c.num}] {c.pageTitle.length > 30 ? c.pageTitle.slice(0, 30) + '...' : c.pageTitle}</span>
            <span style={{ color: 'var(--tx-2)', whiteSpace: 'normal', lineHeight: 1.35 }}>
              {c.contentSnippet}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
