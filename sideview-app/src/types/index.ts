export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeContext?: CodeContext;
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
