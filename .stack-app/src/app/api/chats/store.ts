/**
 * In-memory chat session store
 * MVP: data is lost on server restart. Migrate to DB for production.
 */

import { randomUUID } from 'crypto';
import type { ChatSession, ChatListItem, CreateChatBody, UpdateChatBody } from '@/types/chat-history';
import type { Message } from '@/types';

const store = new Map<string, ChatSession>();

function toListItem(session: ChatSession): ChatListItem {
  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
  };
}

function now(): string {
  return new Date().toISOString();
}

export function listChats(): ChatListItem[] {
  return Array.from(store.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(toListItem);
}

export function getChat(id: string): ChatSession | undefined {
  return store.get(id);
}

export function createChat(body: CreateChatBody = {}): ChatSession {
  const id = randomUUID();
  const ts = now();
  const session: ChatSession = {
    id,
    title: body.title ?? 'New Chat',
    messages: body.messages ?? [],
    createdAt: ts,
    updatedAt: ts,
  };
  store.set(id, session);
  return session;
}

export function updateChat(id: string, body: UpdateChatBody): ChatSession | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;

  const session: ChatSession = {
    ...existing,
    ...(body.title !== undefined && { title: body.title }),
    ...(body.messages !== undefined && { messages: body.messages }),
    updatedAt: now(),
  };
  store.set(id, session);
  return session;
}

export function deleteChat(id: string): boolean {
  return store.delete(id);
}
