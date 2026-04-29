'use client';

import { useState, useEffect } from 'react';
import { Icon } from './icons';
import styles from './sidebar-toggle.module.css';

const STORAGE_KEY = 'brainstack-sidebar-collapsed';

export function SidebarToggle({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }

  return (
    <div className={styles.wrapper}>
      {/* Sidebar container */}
      <div
        className={styles.sidebarContainer}
        data-mounted={mounted}
        data-collapsed={collapsed}
      >
        {children}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        className={styles.toggleBtn}
        data-mounted={mounted}
        data-collapsed={collapsed}
      >
        <Icon name={collapsed ? 'menu' : 'chevronLeft'} size={14} />
      </button>
    </div>
  );
}
