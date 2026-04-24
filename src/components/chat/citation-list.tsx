'use client';

import Link from 'next/link';

export interface ChatCitation {
  num: number;
  pageTitle: string;
  pageSlug: string;
  anchorId: string | null;
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--teal-bg)',
              border: '1px solid var(--teal-bd)',
              color: 'var(--teal)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              transition: 'background .15s',
              whiteSpace: 'nowrap',
            }}
          >
            [{c.num}] {c.pageTitle.length > 30 ? c.pageTitle.slice(0, 30) + '...' : c.pageTitle}
          </Link>
        );
      })}
    </div>
  );
}
