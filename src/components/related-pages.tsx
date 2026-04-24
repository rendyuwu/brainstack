import Link from 'next/link';
import { db } from '@/db';
import { pageRelations, pages } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

const RELATION_LABELS: Record<string, string> = {
  related: 'Related',
  prerequisite: 'Prerequisite',
  'see-also': 'See Also',
};

export async function RelatedPages({ pageId }: { pageId: string }) {
  const relations = await db
    .select({
      relationId: pageRelations.id,
      sourcePageId: pageRelations.sourcePageId,
      targetPageId: pageRelations.targetPageId,
      relationType: pageRelations.relationType,
      pageId: pages.id,
      title: pages.title,
      slug: pages.slug,
      type: pages.type,
    })
    .from(pageRelations)
    .innerJoin(
      pages,
      and(
        or(
          and(
            eq(pageRelations.sourcePageId, pageId),
            eq(pages.id, pageRelations.targetPageId)
          ),
          and(
            eq(pageRelations.targetPageId, pageId),
            eq(pages.id, pageRelations.sourcePageId)
          )
        ),
        eq(pages.status, 'published')
      )
    )
    .where(
      or(
        eq(pageRelations.sourcePageId, pageId),
        eq(pageRelations.targetPageId, pageId)
      )
    );

  if (relations.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid var(--bd-subtle)',
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          color: 'var(--tx-3)',
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          margin: '0 0 14px',
        }}
      >
        Related Pages
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {relations.map((rel) => (
          <Link
            key={rel.relationId}
            href={`/blog/${rel.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-default)',
              textDecoration: 'none',
              transition: 'border-color .15s',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'var(--bg-3)',
                color: 'var(--tx-3)',
                letterSpacing: '.02em',
                flexShrink: 0,
              }}
            >
              {RELATION_LABELS[rel.relationType] ?? rel.relationType}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--tx-1)',
              }}
            >
              {rel.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
