/**
 * POST /api/chat
 * 
 * Main chat endpoint with streaming support for both Claude and OpenAI models.
 * Supports code context for coding assistance.
 */

import { NextRequest } from 'next/server';
import { streamClaudeResponse, isAnthropicConfigured, getClaudeResponse } from '@/lib/ai/anthropic';
import { streamOpenAIResponse, isOpenAIConfigured, getOpenAIResponse } from '@/lib/ai/openai';
import { buildCodingPrompt } from '@/lib/ai/prompts';
import { createAnthropicStream, createOpenAIStream, SSE_HEADERS } from '@/lib/ai/stream';
import { validateChatRequest, isClaudeModel, isOpenAIModel } from '@/lib/validators/chat';
import { Errors, handleError } from '@/lib/errors';
import { getNumericEnv } from '@/lib/utils';

/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    const resetAt = now + RATE_WINDOW;
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetAt: record.resetAt };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          details: `Try again in ${retryAfter} seconds`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Errors.badRequest('Invalid JSON in request body').toResponse();
    }

    const validation = validateChatRequest(body);
    if (!validation.success) {
      return Errors.validation(validation.error, JSON.stringify(validation.details)).toResponse();
    }

    const { messages, model, codeContext, stream = true } = validation.data;

    // Check if the required provider is configured
    if (isClaudeModel(model) && !isAnthropicConfigured()) {
      return Errors.modelNotAvailable(model).toResponse();
    }
    if (isOpenAIModel(model) && !isOpenAIConfigured()) {
      return Errors.modelNotAvailable(model).toResponse();
    }

    // Build the system prompt with code context
    const systemPrompt = buildCodingPrompt(codeContext);
    const maxTokens = getNumericEnv('MAX_TOKENS', 4096);

    // Handle streaming response
    if (stream) {
      if (isClaudeModel(model)) {
        const claudeStream = await streamClaudeResponse(messages, systemPrompt, maxTokens);
        const readableStream = createAnthropicStream(claudeStream);
        
        return new Response(readableStream, {
          headers: {
            ...SSE_HEADERS,
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        });
      } else {
        const openaiStream = await streamOpenAIResponse(messages, systemPrompt, model, maxTokens);
        const readableStream = createOpenAIStream(openaiStream);
        
        return new Response(readableStream, {
          headers: {
            ...SSE_HEADERS,
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        });
      }
    }

    // Handle non-streaming response
    let content: string;
    if (isClaudeModel(model)) {
      content = await getClaudeResponse(messages, systemPrompt, maxTokens);
    } else {
      content = await getOpenAIResponse(messages, systemPrompt, model, maxTokens);
    }

    return Response.json(
      {
        content,
        model,
        finishReason: 'stop',
      },
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    const apiError = handleError(error);
    return apiError.toResponse();
  }
}

/**
 * Handle OPTIONS for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
