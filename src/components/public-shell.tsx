'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopNav } from './top-nav';
import { CommandPalette } from './command-palette';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const openCommandPalette = useCallback(() => {
    setSearchOpen(true);
  }, []);

  /* Cmd+K / Ctrl+K toggle */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /* Additional global shortcuts (Ctrl+/, Ctrl+N) */
  useKeyboardShortcuts({ openCommandPalette });

  return (
    <>
      <TopNav onSearchOpen={openCommandPalette} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      {children}
    </>
  );
}
