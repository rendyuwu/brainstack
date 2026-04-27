'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutActions {
  openCommandPalette: () => void;
}

/**
 * Global keyboard shortcuts hook.
 * - Ctrl+K / Cmd+K → open command palette (handled in PublicShell)
 * - Ctrl+/ → focus search (open command palette)
 * - Ctrl+N / Cmd+N → new page (/editor/new)
 */
export function useKeyboardShortcuts({ openCommandPalette }: ShortcutActions) {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl+/ → open command palette with search focus
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Ctrl+N / Cmd+N → new page (skip if typing in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isInput) {
        e.preventDefault();
        router.push('/editor/new');
        return;
      }
    },
    [openCommandPalette, router]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
