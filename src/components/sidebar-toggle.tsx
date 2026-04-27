'use client';

import { useState, useEffect } from 'react';
import { Icon } from './icons';

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
    <div style={{ display: 'flex', position: 'relative', height: '100%' }}>
      {/* Sidebar container */}
      <div
        style={{
          width: collapsed ? 0 : 220,
          minWidth: collapsed ? 0 : 220,
          overflow: 'hidden',
          transition: mounted ? 'width .2s ease, min-width .2s ease' : 'none',
          height: '100%',
          flexShrink: 0,
        }}
      >
        {children}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
        style={{
          position: 'absolute',
          left: collapsed ? 4 : 208,
          top: 8,
          zIndex: 10,
          width: 26,
          height: 26,
          borderRadius: 6,
          border: '1px solid var(--bd-default)',
          background: 'var(--bg-2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tx-3)',
          transition: mounted ? 'left .2s ease' : 'none',
          padding: 0,
        }}
      >
        <Icon name={collapsed ? 'menu' : 'chevronLeft'} size={14} />
      </button>
    </div>
  );
}
