/**
 * Chat history type definitions
 * Used by History Chat API and Frontend
 */

import type { Message } from './index';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CreateChatBody {
  title?: string;
  messages?: Message[];
}

export interface UpdateChatBody {
  title?: string;
  messages?: Message[];
}
