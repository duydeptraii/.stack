export interface Attachment {
  type: 'image' | 'file';
  name: string;
  data: string;  // base64 for images, plain text for files
  mimeType?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeContext?: CodeContext;
  attachments?: Attachment[];
}

export interface CodeContext {
  fileName: string;
  language: string;
  selectedCode: string;
  startLine: number;
  endLine: number;
  initialMessage?: string;
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
};

export type Theme = 'light' | 'dark' | 'system';

// Re-export chat history types for convenience
export type { ChatSession, ChatListItem, CreateChatBody, UpdateChatBody } from './chat-history';
