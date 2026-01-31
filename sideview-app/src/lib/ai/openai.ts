/**
 * OpenAI client wrapper
 */

import OpenAI from 'openai';
import type { Message, ModelId } from '@/types/chat';
import type { Stream } from 'openai/streaming';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

// Lazy initialization to avoid errors when API key is not set
let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Model mapping from our model IDs to OpenAI model IDs
 */
const MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
};

/**
 * Stream a response from OpenAI
 */
export async function streamOpenAIResponse(
  messages: Message[],
  systemPrompt: string,
  model: ModelId = 'gpt-4o',
  maxTokens: number = 4096
): Promise<Stream<ChatCompletionChunk>> {
  const client = getClient();

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  const stream = await client.chat.completions.create({
    model: MODEL_MAP[model] || 'gpt-4o',
    max_tokens: maxTokens,
    stream: true,
    messages: openaiMessages,
  });

  return stream;
}

/**
 * Get a non-streaming response from OpenAI
 */
export async function getOpenAIResponse(
  messages: Message[],
  systemPrompt: string,
  model: ModelId = 'gpt-4o',
  maxTokens: number = 4096
): Promise<string> {
  const client = getClient();

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  const response = await client.chat.completions.create({
    model: MODEL_MAP[model] || 'gpt-4o',
    max_tokens: maxTokens,
    stream: false,
    messages: openaiMessages,
  });

  return response.choices[0]?.message?.content || '';
}
