import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tag } from '@/components/tag';
import { Breadcrumb } from '@/components/breadcrumb';
import { Icon } from '@/components/icons';
import { getPageWithCollection, getPublishedPages } from '@/lib/pages';
import { renderMDX } from '@/lib/mdx';
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
  const description = page.summary ?? `Cheatsheet for ${page.title}`;
  return {
    title: `${page.title} Cheatsheet`,
    description,
    openGraph: {
      title: `${page.title} Cheatsheet`,
      description,
      type: 'article',
      url: `/cheatsheets/${slug}`,
      ...(page.publishedAt && { publishedTime: new Date(page.publishedAt).toISOString() }),
      tags: page.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.title} Cheatsheet`,
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

export default async function CheatsheetPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageWithCollection(slug);

  if (!page) notFound();

  const colorKey = page.collection ? COLOR_MAP[page.collection.slug] ?? 'default' : 'default';
  const mdxSource = page.mdxSource ?? '';

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

  const breadcrumbItems = [];
  if (page.collection) {
    breadcrumbItems.push({
      label: page.collection.name,
      href: `/discover?topic=${page.collection.slug}`,
    });
  }
  breadcrumbItems.push({ label: page.title });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <Breadcrumb items={breadcrumbItems} />
        <div
          style={{
            marginTop: 20,
            marginBottom: 28,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {page.collection && <Tag label={page.collection.name} color={colorKey} />}
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-3)',
                  border: '1px solid var(--bd-default)',
                  fontSize: 11,
                  color: 'var(--tx-2)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                cheatsheet
              </span>
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: 'var(--tx-1)',
                margin: '0 0 6px',
                letterSpacing: '-.03em',
              }}
            >
              {page.title}
            </h1>
            {page.summary && (
              <p style={{ fontSize: 13.5, color: 'var(--tx-2)', margin: 0 }}>
                {page.summary}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href={`/blog/${slug}`}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                background: 'var(--bg-2)',
                border: '1px solid var(--bd-default)',
                color: 'var(--tx-2)',
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
              }}
            >
              <Icon name="book" size={13} /> Full Article
            </Link>
          </div>
        </div>

        {/* Cheatsheet content — rendered MDX in a more compact style */}
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--bd-default)',
            borderRadius: 10,
            overflow: 'hidden',
            padding: '24px',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--tx-1)',
          }}
        >
          {content ?? (
            <div style={{ color: 'var(--tx-3)', padding: '20px 0', textAlign: 'center' }}>
              No cheatsheet content available for this page.
            </div>
          )}
        </div>

        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: page.title,
            description: page.summary ?? `Cheatsheet for ${page.title}`,
            ...(page.publishedAt && { datePublished: new Date(page.publishedAt).toISOString() }),
          }}
        />

        <RelatedPages pageId={page.id} />
      </div>
    </div>
  );
}
