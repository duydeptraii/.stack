/**
 * Unified streaming handler for AI providers
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { Stream } from 'openai/streaming';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

export type AIProvider = 'anthropic' | 'openai';

/**
 * Extract text content from Anthropic stream chunk
 */
function extractAnthropicText(event: Anthropic.MessageStreamEvent): string | null {
  if (event.type === 'content_block_delta') {
    const delta = event.delta;
    if ('text' in delta) {
      return delta.text;
    }
  }
  return null;
}

/**
 * Extract text content from OpenAI stream chunk
 */
function extractOpenAIText(chunk: ChatCompletionChunk): string | null {
  const delta = chunk.choices[0]?.delta;
  return delta?.content || null;
}

/**
 * Create a ReadableStream from an Anthropic message stream
 */
export function createAnthropicStream(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          const text = extractAnthropicText(event);
          if (text) {
            const data = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

/**
 * Create a ReadableStream from an OpenAI chat completion stream
 */
export function createOpenAIStream(
  stream: Stream<ChatCompletionChunk>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = extractOpenAIText(chunk);
          if (text) {
            const data = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Check for finish reason
          const finishReason = chunk.choices[0]?.finish_reason;
          if (finishReason === 'stop' || finishReason === 'length') {
            break;
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

/**
 * SSE response headers
 */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no', // Disable nginx buffering
} as const;
