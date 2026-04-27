import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag } from '@/components/tag';
import { Breadcrumb } from '@/components/breadcrumb';
import { Icon } from '@/components/icons';
import { getPageWithCollection, getPublishedPages } from '@/lib/pages';
import { renderMDX, extractHeadings, estimateReadTime } from '@/lib/mdx';
import { ArticleTOC } from '@/components/article-toc';
import { ArticleChatToggle } from '@/components/chat/article-chat-toggle';
import { RelatedPages } from '@/components/related-pages';
import { JsonLd } from '@/components/json-ld';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const COLOR_MAP: Record<string, string> = {
  docker: 'docker',
  linux: 'linux',
  git: 'git',
  kubernetes: 'k8s',
  nginx: 'nginx',
  postgresql: 'postgres',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageWithCollection(slug);
  if (!page) return { title: 'Not Found' };
  const description = page.summary ?? `Read ${page.title} on BrainStack`;
  return {
    title: page.title,
    description,
    openGraph: {
      title: page.title,
      description,
      type: 'article',
      url: `/blog/${slug}`,
      ...(page.publishedAt && { publishedTime: new Date(page.publishedAt).toISOString() }),
      ...(page.updatedAt && { modifiedTime: new Date(page.updatedAt).toISOString() }),
      tags: page.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
    },
  };
}

export async function generateStaticParams() {
  try {
    const pages = await getPublishedPages();
    return pages.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageWithCollection(slug);

  if (!page) notFound();

  const mdxSource = page.mdxSource ?? '';
  const headings = extractHeadings(mdxSource);
  const readTime = estimateReadTime(mdxSource);
  const colorKey = page.collection ? COLOR_MAP[page.collection.slug] ?? 'default' : 'default';

  const breadcrumbItems = [];
  if (page.collection) {
    breadcrumbItems.push({
      label: page.collection.name,
      href: `/discover?topic=${page.collection.slug}`,
    });
  }
  breadcrumbItems.push({ label: page.title });

  let content = null;
  if (mdxSource) {
    try {
      content = await renderMDX(mdxSource);
    } catch {
      content = (
        <div style={{ color: 'var(--tx-3)', padding: '20px 0' }}>
          Failed to render content.
        </div>
      );
    }
  }

  const date = page.publishedAt
    ? new Date(page.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: page.title,
          description: page.summary ?? '',
          ...(page.publishedAt && { datePublished: new Date(page.publishedAt).toISOString() }),
          ...(page.updatedAt && { dateModified: new Date(page.updatedAt).toISOString() }),
          author: { '@type': 'Organization', name: 'BrainStack' },
          publisher: { '@type': 'Organization', name: 'BrainStack' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `/blog/${slug}` },
          keywords: page.tags,
        }}
      />
      {/* TOC sidebar */}
      {headings.length > 0 && (
        <div
          className="toc-sidebar"
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid var(--bd-subtle)',
            padding: '24px 0',
            overflowY: 'auto',
            background: 'var(--bg-1)',
          }}
        >
          <div
            style={{
              padding: '0 16px 10px',
              fontSize: 11,
              color: 'var(--tx-3)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            Contents
          </div>
          <ArticleTOC headings={headings} />
        </div>
      )}

      {/* Article content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: '32px 48px 80px',
          maxWidth: 760,
          minWidth: 0,
        }}
      >
        <Breadcrumb items={breadcrumbItems} />

        <div style={{ marginTop: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {page.collection && <Tag label={page.collection.name} color={colorKey} />}
            {page.tags.map((tag) => (
              <Tag key={tag} label={tag} small />
            ))}
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--tx-1)',
              margin: '0 0 12px',
              lineHeight: 1.25,
              letterSpacing: '-.03em',
            }}
          >
            {page.title}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 13,
              color: 'var(--tx-3)',
            }}
          >
            {date && <span>{date}</span>}
            <span>{readTime} min read</span>
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            <Link
              href={`/blog/${slug}`}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                background: 'var(--bg-3)',
                border: '1px solid var(--bd-strong)',
                color: 'var(--tx-1)',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
              }}
            >
              <Icon name="book" size={12} />
              Article
            </Link>
            <Link
              href={`/cheatsheets/${slug}`}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                background: 'var(--bg-2)',
                border: '1px solid var(--bd-default)',
                color: 'var(--tx-2)',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
              }}
            >
              <Icon name="list" size={12} />
              Cheatsheet
            </Link>
            <div style={{ marginLeft: 'auto' }}>
              <ArticleChatToggle pageId={page.id} />
            </div>
          </div>
        </div>

        {/* Article body */}
        <div style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--tx-1)' }}>
          {content ?? (
            <div style={{ color: 'var(--tx-3)', padding: '20px 0' }}>
              No content available.
            </div>
          )}
        </div>

        <RelatedPages pageId={page.id} />
      </div>
    </div>
  );
}
