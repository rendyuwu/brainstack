import Link from 'next/link';
import { Icon } from './icons';
import { getCollections } from '@/lib/pages';
import { SidebarTree } from './sidebar-tree';

export async function Sidebar() {
  const collections = await getCollections();

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--bd-default)',
        background: 'var(--bg-1)',
        overflowY: 'auto',
        padding: '16px 0',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '0 12px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--tx-3)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
          }}
        >
          Topic Stacks
        </div>
      </div>

      <SidebarTree collections={collections} />

      <div style={{ margin: '16px 12px', height: 1, background: 'var(--bd-subtle)' }} />

      <div
        style={{
          padding: '0 12px 12px',
          fontSize: 11,
          color: 'var(--tx-3)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        Quick Access
      </div>
      {[
        { label: 'All Cheatsheets', icon: 'list', href: '/cheatsheets' },
        { label: 'Ask the KB', icon: 'sparkles', href: '/ask' },
      ].map(({ label, icon, href }) => (
        <Link
          key={href}
          href={href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            cursor: 'pointer',
            color: 'var(--tx-2)',
            transition: 'all .1s',
            fontSize: 13.5,
            textDecoration: 'none',
          }}
        >
          <Icon name={icon} size={14} />
          <span>{label}</span>
        </Link>
      ))}
    </aside>
  );
}
