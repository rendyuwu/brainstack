import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPublishedPages, getCollections } from '@/lib/pages';
import { estimateReadTime } from '@/lib/mdx';
import { PageListClient } from '@/components/page-list-client';

const COLOR_MAP: Record<string, string> = {
  docker: 'docker',
  linux: 'linux',
  git: 'git',
  kubernetes: 'k8s',
  nginx: 'nginx',
  postgresql: 'postgres',
};

export const metadata: Metadata = {
  title: 'Cheatsheets',
  description:
    'Quick-reference cheatsheets for DevOps and infrastructure — Docker, Kubernetes, Linux, Git, Nginx, and PostgreSQL.',
  openGraph: {
    title: 'Cheatsheets | BrainStack',
    description: 'Quick-reference cheatsheets for DevOps and infrastructure.',
    url: '/cheatsheets',
  },
};

export default async function CheatsheetsPage() {
  const [publishedPages, collections] = await Promise.all([
    getPublishedPages(),
    getCollections(),
  ]);

  const articles = publishedPages
    .filter((page) => page.type === 'cheatsheet')
    .map((page) => {
      const collection = collections.find((c) => c.id === page.collectionId);
      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        type: page.type ?? 'tutorial',
        topic: collection?.slug ?? '',
        topicLabel: collection?.name ?? '',
        color: collection ? COLOR_MAP[collection.slug] ?? 'default' : 'default',
        mins: estimateReadTime(page.mdxSource ?? ''),
        date: page.publishedAt
          ? new Date(page.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '',
        summary: page.summary ?? '',
      };
    });

  const topicFilters = [
    { id: 'all', label: 'All' },
    ...collections.map((c) => ({ id: c.slug, label: c.name })),
  ];

  return (
    <Suspense>
      <PageListClient
        title="Cheatsheets"
        subtitle={`${articles.length} quick-reference cheatsheets`}
        articles={articles}
        topicFilters={topicFilters}
        totalCount={articles.length}
        basePath="/cheatsheets"
      />
    </Suspense>
  );
}
