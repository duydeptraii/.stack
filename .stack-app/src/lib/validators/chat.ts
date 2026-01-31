/**
 * Request validation schemas using Zod
 */

import { z } from 'zod';
import type { ChatRequest, ModelId } from '@/types/chat';

/**
 * Supported model IDs
 */
export const SUPPORTED_MODELS = ['claude-3-5-sonnet', 'gpt-4o', 'gpt-4o-mini'] as const;

/**
 * Message schema
 */
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty').max(100000, 'Message too long'),
});

/**
 * Code context schema
 */
export const codeContextSchema = z.object({
  fullCode: z.string().min(1, 'Code cannot be empty').max(500000, 'Code too long'),
  selectedPortion: z.string().max(100000, 'Selected portion too long').optional(),
  language: z.string().min(1, 'Language is required').max(50, 'Language name too long'),
  filename: z.string().max(500, 'Filename too long').optional(),
});

/**
 * Chat request schema
 */
export const chatRequestSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Too many messages'),
  model: z.enum(SUPPORTED_MODELS),
  codeContext: codeContextSchema.optional(),
  stream: z.boolean().default(true),
});

/**
 * Validation result type
 */
export type ChatValidationResult =
  | { success: true; data: ChatRequest }
  | { success: false; error: string; details: z.ZodIssue[] };

/**
 * Validate a chat request
 */
export function validateChatRequest(body: unknown): ChatValidationResult {
  const result = chatRequestSchema.safeParse(body);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || 'Invalid request',
      details: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data as ChatRequest,
  };
}

/**
 * Check if a model is Claude-based
 */
export function isClaudeModel(model: ModelId): boolean {
  return model.startsWith('claude');
}

/**
 * Check if a model is OpenAI-based
 */
export function isOpenAIModel(model: ModelId): boolean {
  return model.startsWith('gpt');
}

/**
 * Get the provider for a model
 */
export function getModelProvider(model: ModelId): 'anthropic' | 'openai' {
  return isClaudeModel(model) ? 'anthropic' : 'openai';
}
