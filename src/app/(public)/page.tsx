import Link from 'next/link';
import type { Metadata } from 'next';
import { Icon } from '@/components/icons';
import { Tag } from '@/components/tag';
import { getPublishedPages, getCollections, getAllTags } from '@/lib/pages';
import { estimateReadTime } from '@/lib/mdx';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description:
    'Tutorials, docs, and cheatsheets for developers and ops engineers. Browse topic stacks on Docker, Kubernetes, Linux, Git, Nginx, and PostgreSQL.',
  openGraph: {
    title: 'Knowledge Base | BrainStack',
    description:
      'Tutorials, docs, and cheatsheets for developers and ops engineers.',
    url: '/',
  },
};

const ICON_MAP: Record<string, string> = {
  docker: 'layers',
  linux: 'terminal',
  git: 'file',
  kubernetes: 'cpu',
  nginx: 'globe',
  postgresql: 'book',
};

const COLOR_MAP: Record<string, string> = {
  docker: 'docker',
  linux: 'linux',
  git: 'git',
  kubernetes: 'k8s',
  nginx: 'nginx',
  postgresql: 'postgres',
};

export default async function HomePage() {
  const [publishedPages, collections, tags] = await Promise.all([
    getPublishedPages(),
    getCollections(),
    getAllTags(),
  ]);

  const recentPages = publishedPages.slice(0, 6);

  return (
    <div className={styles.pageScroller}>
      <div className={styles.pageContent}>
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: 'var(--tx-1)',
              margin: '0 0 6px',
              letterSpacing: '-.03em',
            }}
          >
            Knowledge Base
          </h1>
          <p style={{ fontSize: 15, color: 'var(--tx-2)', margin: 0 }}>
            Tutorials, docs, and cheatsheets for developers and ops engineers.
          </p>
        </div>

        {/* Topic stack pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/discover?topic=${c.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'var(--bg-2)',
                border: '1px solid var(--bd-default)',
                cursor: 'pointer',
                color: 'var(--tx-2)',
                fontSize: 13.5,
                fontWeight: 500,
                transition: 'all .15s',
                textDecoration: 'none',
              }}
            >
              <Icon name={ICON_MAP[c.slug] ?? 'book'} size={14} />
              {c.name}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--tx-3)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {c.pages.length}
              </span>
            </Link>
          ))}
        </div>

        {/* Two-column layout */}
        <div className={styles.grid}>
          {/* Recent articles */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--tx-2)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Recent Posts
              </h2>
              <Link
                href="/discover"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--amber)',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                }}
              >
                View all <Icon name="arrowRight" size={13} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentPages.map((page) => {
                const collection = collections.find(
                  (c) => c.id === page.collectionId
                );
                const colorKey = collection
                  ? COLOR_MAP[collection.slug] ?? 'default'
                  : 'default';
                const readTime = estimateReadTime(page.mdxSource ?? '');
                const date = page.publishedAt
                  ? new Date(page.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <Link
                    key={page.id}
                    href={`/blog/${page.slug}`}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all .15s',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      {collection && (
                        <Tag label={collection.name} color={colorKey} small />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--tx-3)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {date}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--tx-3)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        · {readTime} min
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 15.5,
                        fontWeight: 500,
                        color: 'var(--tx-1)',
                        marginBottom: 5,
                        lineHeight: 1.4,
                        letterSpacing: '-.01em',
                      }}
                    >
                      {page.title}
                    </div>
                    {page.summary && (
                      <div
                        style={{
                          fontSize: 13.5,
                          color: 'var(--tx-2)',
                          lineHeight: 1.55,
                        }}
                      >
                        {page.summary}
                      </div>
                    )}
                  </Link>
                );
              })}
              {recentPages.length === 0 && (
                <div
                  style={{
                    padding: '40px 0',
                    textAlign: 'center',
                    color: 'var(--tx-3)',
                  }}
                >
                  No published posts yet.
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Ask AI CTA */}
            <div
              style={{
                background: 'var(--teal-bg)',
                border: '1px solid var(--teal-bd)',
                borderRadius: 10,
                padding: '18px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Icon name="sparkles" size={15} style={{ color: 'var(--teal)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>
                  Ask the Knowledge Base
                </span>
              </div>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  color: 'var(--tx-2)',
                  lineHeight: 1.55,
                }}
              >
                Ask questions grounded in all articles, tutorials, and docs. Answers
                include citations to exact sections.
              </p>
              <Link
                href="/ask"
                style={{
                  background: 'var(--teal)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#000',
                  padding: '7px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  textDecoration: 'none',
                }}
              >
                Open AI Chat <Icon name="arrowRight" size={13} style={{ color: '#000' }} />
              </Link>
            </div>

            {/* Tags */}
            <div>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--tx-2)',
                  margin: '0 0 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Tags
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.slice(0, 16).map((tag) => (
                  <Tag key={tag} label={tag} small />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
