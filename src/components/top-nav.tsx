'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';
import { useTheme } from './theme-provider';
import styles from './top-nav.module.css';

interface TopNavProps {
  onSearchOpen?: () => void;
}

const NAV_LINKS = [
  { href: '/discover', label: 'Discover', icon: 'home' },
  { href: '/blog', label: 'Article', icon: 'book' },
  { href: '/cheatsheets', label: 'Cheatsheet', icon: 'list' },
];

export function TopNav({ onSearchOpen }: TopNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setIsAuthenticated(true);
        if (data?.user?.role === 'admin') setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className={styles.header}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <div className={styles.logoIcon}>
          <Icon name="layers" size={15} />
        </div>
        <span className={styles.logoText}>
          Brain<span className={styles.logoAccent}>Stack</span>
        </span>
      </Link>

      {/* Search bar trigger */}
      <div
        onClick={onSearchOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSearchOpen?.();
          }
        }}
        role="button"
        tabIndex={0}
        className={styles.searchBar}
      >
        <Icon name="search" size={14} />
        <span className={styles.searchPlaceholder}>Search docs, tutorials, cheatsheets...</span>
        <kbd className={styles.searchKbd}>Cmd+K</kbd>
      </div>

      <div className={styles.spacer} />

      {/* Nav links */}
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${styles.navLink} nav-link-desktop`}
          data-active={isActive(link.href)}
        >
          <Icon name={link.icon} size={14} />
          <span className="nav-label">{link.label}</span>
        </Link>
      ))}

      {/* §V.39, §V.40: Ask AI — admin only */}
      {isAdmin && (
        <Link
          href="/ask"
          className={`${styles.navLink} nav-link-desktop`}
          data-active={isActive('/ask')}
        >
          <Icon name="sparkles" size={14} />
          <span className="nav-label">Ask AI</span>
        </Link>
      )}

      <div className={styles.divider} />

      {/* Theme toggle */}
      <button onClick={toggleTheme} className={styles.iconBtn}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>

      {/* Admin */}
      {isAdmin && (
        <Link href="/admin/ai/providers" className={styles.iconBtn}>
          <Icon name="shield" size={16} />
        </Link>
      )}

      {/* §V.39: Settings — admin only */}
      {isAdmin && (
        <Link href="/settings" className={styles.iconBtn}>
          <Icon name="settings" size={16} />
        </Link>
      )}

      {/* Logout — any authenticated user */}
      {isAuthenticated && (
        <button
          onClick={() => {
            fetch('/api/auth/signout', { method: 'POST' })
              .finally(() => { window.location.href = '/login'; });
          }}
          title="Sign out"
          className={styles.iconBtn}
        >
          <Icon name="logOut" size={16} />
        </button>
      )}

      {/* §V.39: New Post — admin only */}
      {isAdmin && (
        <Link href="/editor" className={styles.newPostBtn}>
          <Icon name="plus" size={13} />
          <span className="nav-label">New Post</span>
        </Link>
      )}
    </header>
  );
}
