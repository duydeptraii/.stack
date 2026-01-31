/**
 * Chat-related type definitions
 */

export type ModelId = 'claude-3-5-sonnet' | 'gpt-4o' | 'gpt-4o-mini';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface CodeContext {
  /** The full code being referenced */
  fullCode: string;
  /** Optional highlighted/selected portion of the code */
  selectedPortion?: string;
  /** Programming language of the code */
  language: string;
  /** Optional filename for context */
  filename?: string;
}

export interface ChatRequest {
  messages: Message[];
  model: ModelId;
  codeContext?: CodeContext;
  /** Enable streaming response (default: true) */
  stream?: boolean;
}

export interface StreamChunk {
  text: string;
}

export interface ChatCompletionResponse {
  content: string;
  model: ModelId;
  finishReason: 'stop' | 'length' | 'error';
}
