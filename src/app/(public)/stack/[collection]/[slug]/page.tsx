import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Tag } from '@/components/tag';
import { Breadcrumb } from '@/components/breadcrumb';
import { getPageWithCollection, getCollectionBySlug, getPagesByCollection } from '@/lib/pages';
import { renderMDX, extractHeadings, estimateReadTime } from '@/lib/mdx';
import { ArticleTOC } from '@/components/article-toc';
import { RelatedPages } from '@/components/related-pages';

interface PageProps {
  params: Promise<{ collection: string; slug: string }>;
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
  const colName = page.collection?.name ?? '';
  return {
    title: `${page.title} — ${colName} — BrainStack`,
    description: page.summary ?? `${page.title} in ${colName}`,
  };
}

export async function generateStaticParams() {
  try {
    const collectionSlugs = ['docker', 'linux', 'git', 'kubernetes', 'nginx', 'postgresql'];
    const params = [];
    for (const colSlug of collectionSlugs) {
      const pages = await getPagesByCollection(colSlug);
      for (const page of pages) {
        params.push({ collection: colSlug, slug: page.slug });
      }
    }
    return params;
  } catch {
    // DB may not have data at build time (CI, fresh deploy)
    return [];
  }
}

export default async function StackPage({ params }: PageProps) {
  const { collection: collectionSlug, slug } = await params;
  const page = await getPageWithCollection(slug);
  const collection = await getCollectionBySlug(collectionSlug);

  if (!page || !collection || page.collectionId !== collection.id) notFound();

  const mdxSource = page.mdxSource ?? '';
  const headings = extractHeadings(mdxSource);
  const readTime = estimateReadTime(mdxSource);
  const colorKey = COLOR_MAP[collectionSlug] ?? 'default';

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
        <Breadcrumb
          items={[
            { label: collection.name, href: `/discover?topic=${collectionSlug}` },
            { label: page.title },
          ]}
        />

        <div style={{ marginTop: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Tag label={collection.name} color={colorKey} />
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
