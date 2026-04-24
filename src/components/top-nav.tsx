'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';
import { useTheme } from './theme-provider';

interface TopNavProps {
  onSearchOpen?: () => void;
}

const NAV_LINKS = [
  { href: '/discover', label: 'Discover', icon: 'home' },
  { href: '/blog', label: 'Article', icon: 'book' },
  { href: '/cheatsheets', label: 'Cheatsheet', icon: 'list' },
  { href: '/ask', label: 'Ask AI', icon: 'sparkles' },
];

export function TopNav({ onSearchOpen }: TopNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--bd-default)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          flexShrink: 0,
          userSelect: 'none',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="layers" size={15} style={{ color: '#000' }} />
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: '-.02em',
            color: 'var(--tx-1)',
          }}
        >
          Brain<span style={{ color: 'var(--amber)' }}>Stack</span>
        </span>
      </Link>

      {/* Search bar trigger */}
      <div
        onClick={onSearchOpen}
        style={{
          flex: 1,
          maxWidth: 440,
          margin: '0 8px',
          background: 'var(--bg-0)',
          border: '1px solid var(--bd-default)',
          borderRadius: 7,
          padding: '0 12px',
          height: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          color: 'var(--tx-3)',
          fontSize: 13.5,
          transition: 'border-color .15s',
        }}
      >
        <Icon name="search" size={14} />
        <span style={{ flex: 1 }}>Search docs, tutorials, cheatsheets...</span>
        <kbd
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '2px 6px',
            background: 'var(--bg-2)',
            border: '1px solid var(--bd-default)',
            borderRadius: 4,
            color: 'var(--tx-3)',
          }}
        >
          Cmd+K
        </kbd>
      </div>

      <div style={{ flex: 1 }} />

      {/* Nav links */}
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link-desktop"
            style={{
              cursor: 'pointer',
              color: active ? 'var(--amber)' : 'var(--tx-2)',
              fontSize: 13.5,
              padding: '4px 8px',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: active ? 500 : 400,
              background: active ? 'var(--amber-bg)' : 'none',
              transition: 'all .15s',
              textDecoration: 'none',
            }}
          >
            <Icon name={link.icon} size={14} />
            <span className="nav-label">{link.label}</span>
          </Link>
        );
      })}

      <div style={{ width: 1, height: 20, background: 'var(--bd-default)' }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--tx-2)',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          transition: 'color .15s',
        }}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>

      {/* Settings */}
      <Link
        href="/settings"
        style={{
          color: 'var(--tx-2)',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
      >
        <Icon name="settings" size={16} />
      </Link>

      {/* New Post */}
      <Link
        href="/editor"
        style={{
          background: 'var(--amber)',
          border: 'none',
          cursor: 'pointer',
          color: '#000',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          transition: 'opacity .15s',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <Icon name="plus" size={13} style={{ color: '#000' }} />
        <span className="nav-label">New Post</span>
      </Link>
    </header>
  );
}
