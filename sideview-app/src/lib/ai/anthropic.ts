/**
 * Anthropic Claude client wrapper
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@/types/chat';

// Lazy initialization to avoid errors when API key is not set
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Check if Anthropic API is configured
 */
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Model mapping from our model IDs to Anthropic model IDs
 */
const MODEL_MAP = {
  'claude-3-5-sonnet': 'claude-sonnet-4-20250514',
} as const;

/**
 * Stream a response from Claude
 */
export async function streamClaudeResponse(
  messages: Message[],
  systemPrompt: string,
  maxTokens: number = 4096
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const client = getClient();

  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const stream = client.messages.stream({
    model: MODEL_MAP['claude-3-5-sonnet'],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  return stream;
}

/**
 * Get a non-streaming response from Claude
 */
export async function getClaudeResponse(
  messages: Message[],
  systemPrompt: string,
  maxTokens: number = 4096
): Promise<string> {
  const client = getClient();

  const anthropicMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const response = await client.messages.create({
    model: MODEL_MAP['claude-3-5-sonnet'],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  return textContent ? textContent.text : '';
}
