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
  title: 'Blog — BrainStack',
  description: 'Articles, tutorials, and tips on DevOps and infrastructure',
};

export default async function BlogPage() {
  const [publishedPages, collections] = await Promise.all([
    getPublishedPages(),
    getCollections(),
  ]);

  const articles = publishedPages
    .filter((page) => page.type !== 'cheatsheet')
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
        title="Articles & Tutorials"
        subtitle={`${articles.length} articles across ${topicFilters.length - 1} topic stacks`}
        articles={articles}
        topicFilters={topicFilters}
        totalCount={articles.length}
        basePath="/blog"
      />
    </Suspense>
  );
}
