'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';

interface CollectionWithPages {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  pages: { id: string; title: string; slug: string }[];
}

const ICON_MAP: Record<string, string> = {
  docker: 'layers',
  linux: 'terminal',
  git: 'file',
  kubernetes: 'cpu',
  nginx: 'globe',
  postgresql: 'book',
};

interface SidebarTreeProps {
  collections: CollectionWithPages[];
}

export function SidebarTree({ collections }: SidebarTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (collections.length > 0) {
      init[collections[0].slug] = true;
    }
    return init;
  });

  const toggle = (slug: string) =>
    setExpanded((e) => ({ ...e, [slug]: !e[slug] }));

  return (
    <div>
      {collections.map((collection) => {
        const iconName = ICON_MAP[collection.slug] ?? collection.icon ?? 'book';
        const isExpanded = expanded[collection.slug] ?? false;

        return (
          <div key={collection.id}>
            <div
              onClick={() => toggle(collection.slug)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                cursor: 'pointer',
                color: isExpanded ? 'var(--tx-1)' : 'var(--tx-2)',
                transition: 'background .1s',
              }}
            >
              <Icon
                name={isExpanded ? 'chevronDown' : 'chevronRight'}
                size={12}
                style={{ color: 'var(--tx-3)', flexShrink: 0 }}
              />
              <Icon name={iconName} size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{collection.name}</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--tx-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {collection.pages.length}
              </span>
            </div>
            {isExpanded && (
              <div>
                {collection.pages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/blog/${page.slug}`}
                    style={{
                      display: 'block',
                      padding: '6px 14px 6px 38px',
                      fontSize: 13,
                      color: 'var(--tx-2)',
                      cursor: 'pointer',
                      transition: 'all .1s',
                      borderLeft: '2px solid transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
