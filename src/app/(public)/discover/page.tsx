import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPublishedPages, getCollections } from '@/lib/pages';
import { estimateReadTime } from '@/lib/mdx';
import { DiscoverClient } from './discover-client';

const COLOR_MAP: Record<string, string> = {
  docker: 'docker',
  linux: 'linux',
  git: 'git',
  kubernetes: 'k8s',
  nginx: 'nginx',
  postgresql: 'postgres',
};

export const metadata: Metadata = {
  title: 'Discover',
  description:
    'Browse all articles across topic stacks — filter by Docker, Kubernetes, Linux, Git, Nginx, PostgreSQL, and more.',
  openGraph: {
    title: 'Discover | BrainStack',
    description: 'Browse all articles across topic stacks.',
    url: '/discover',
  },
};

export default async function DiscoverPage() {
  const [publishedPages, collections] = await Promise.all([
    getPublishedPages(),
    getCollections(),
  ]);

  const articles = publishedPages.map((page) => {
    const collection = collections.find((c) => c.id === page.collectionId);
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: page.type,
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
      <DiscoverClient
        articles={articles}
        topicFilters={topicFilters}
        totalCount={publishedPages.length}
      />
    </Suspense>
  );
}
