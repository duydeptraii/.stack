'use client';

import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut } from '@/types';

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        // Allow some shortcuts even in input fields (like Escape)
        const allowInInput = shortcut.key === 'Escape';

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (!isInputField || allowInInput) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts({
  onToggleTheme,
  onNewChat,
  onFocusInput,
  onToggleCodePanel,
}: {
  onToggleTheme?: () => void;
  onNewChat?: () => void;
  onFocusInput?: () => void;
  onToggleCodePanel?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    ...(onToggleTheme
      ? [
          {
            key: 't',
            ctrlKey: true,
            shiftKey: true,
            action: onToggleTheme,
            description: 'Toggle theme',
          },
        ]
      : []),
    ...(onNewChat
      ? [
          {
            key: 'n',
            ctrlKey: true,
            action: onNewChat,
            description: 'New chat',
          },
        ]
      : []),
    ...(onFocusInput
      ? [
          {
            key: '/',
            action: onFocusInput,
            description: 'Focus chat input',
          },
        ]
      : []),
    ...(onToggleCodePanel
      ? [
          {
            key: 'b',
            ctrlKey: true,
            action: onToggleCodePanel,
            description: 'Toggle code panel',
          },
        ]
      : []),
  ];

  useKeyboardShortcuts(shortcuts);
}
