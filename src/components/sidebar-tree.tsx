'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from './icons';
import styles from './sidebar-tree.module.css';

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
              className={styles.collectionHeader}
              data-expanded={isExpanded}
            >
              <Icon
                name={isExpanded ? 'chevronDown' : 'chevronRight'}
                size={12}
                className={styles.chevron}
              />
              <Icon name={iconName} size={14} className={styles.collectionIcon} />
              <span className={styles.collectionName}>{collection.name}</span>
              <span className={styles.collectionCount}>{collection.pages.length}</span>
            </div>
            {isExpanded && (
              <div>
                {collection.pages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/blog/${page.slug}`}
                    className={styles.pageLink}
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
