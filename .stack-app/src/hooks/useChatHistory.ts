'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ChatSession, ChatListItem } from '@/types/chat-history';
import type { Message } from '@/types';

interface UseChatHistoryReturn {
  chats: ChatListItem[];
  activeChat: ChatSession | null;
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
  loadChats: () => Promise<void>;
  loadChat: (id: string) => Promise<void>;
  createChat: () => Promise<string | null>;
  updateChat: (id: string, updates: { title?: string; messages?: Message[] }) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  clearActiveChat: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/chats');
      if (!res.ok) throw new Error('Failed to load chats');
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const parseMessages = useCallback((raw: ChatSession['messages']) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((m) => ({
      ...m,
      timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : m.timestamp,
    }));
  }, []);

  const loadChat = useCallback(
    async (id: string) => {
      try {
        setError(null);
        const res = await fetch(`/api/chats/${id}`);
        if (!res.ok) throw new Error('Failed to load chat');
        const data = await res.json();
        const session: ChatSession = {
          ...data,
          messages: parseMessages(data.messages ?? []),
        };
        setActiveChat(session);
        setActiveChatId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat');
        setActiveChat(null);
        setActiveChatId(null);
      }
    },
    [parseMessages]
  );

  const createChat = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat', messages: [] }),
      });
      if (!res.ok) throw new Error('Failed to create chat');
      const session: ChatSession = await res.json();
      setActiveChat(session);
      setActiveChatId(session.id);
      await loadChats();
      return session.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
      return null;
    }
  }, [loadChats]);

  const updateChat = useCallback(
    async (id: string, updates: { title?: string; messages?: Message[] }) => {
      try {
        setError(null);
        const res = await fetch(`/api/chats/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update chat');
        const session: ChatSession = await res.json();
        if (activeChatId === id) setActiveChat(session);
        await loadChats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update chat');
      }
    },
    [activeChatId, loadChats]
  );

  const deleteChat = useCallback(
    async (id: string) => {
      try {
        setError(null);
        const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete chat');
        if (activeChatId === id) {
          setActiveChat(null);
          setActiveChatId(null);
        }
        await loadChats();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete chat');
      }
    },
    [activeChatId, loadChats]
  );

  const clearActiveChat = useCallback(() => {
    setActiveChat(null);
    setActiveChatId(null);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    activeChat,
    activeChatId,
    isLoading,
    error,
    loadChats,
    loadChat,
    createChat,
    updateChat,
    deleteChat,
    clearActiveChat,
  };
}
