/**
 * GET /api/chats - List all chat sessions
 * POST /api/chats - Create new chat session
 */

import { NextRequest } from 'next/server';
import { ApiError, Errors, handleError } from '@/lib/errors';
import { listChats, createChat } from './store';
import type { CreateChatBody } from '@/types/chat-history';
import type { Message } from '@/types';

function validateCreateBody(body: unknown): CreateChatBody {
  if (!body || typeof body !== 'object') {
    throw Errors.validation('Request body must be an object');
  }
  const b = body as Record<string, unknown>;

  const result: CreateChatBody = {};

  if (b.title !== undefined) {
    if (typeof b.title !== 'string') {
      throw Errors.validation('title must be a string');
    }
    result.title = b.title.trim() || 'New Chat';
  }

  if (b.messages !== undefined) {
    if (!Array.isArray(b.messages)) {
      throw Errors.validation('messages must be an array');
    }
    result.messages = (b.messages as unknown[]).map((m, i) => {
      if (!m || typeof m !== 'object') {
        throw Errors.validation(`messages[${i}] must be an object`);
      }
      const msg = m as Record<string, unknown>;
      if (typeof msg.role !== 'string' || !['user', 'assistant', 'system'].includes(msg.role)) {
        throw Errors.validation(`messages[${i}].role must be 'user', 'assistant', or 'system'`);
      }
      if (typeof msg.content !== 'string') {
        throw Errors.validation(`messages[${i}].content must be a string`);
      }
      const out: Message = {
        id: typeof msg.id === 'string' ? msg.id : `msg-${Date.now()}-${i}`,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: msg.timestamp
          ? new Date(typeof msg.timestamp === 'string' ? msg.timestamp : Date.now())
          : new Date(),
      };
      if (msg.codeContext && typeof msg.codeContext === 'object') {
        out.codeContext = msg.codeContext as Message['codeContext'];
      }
      if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        out.attachments = msg.attachments.map((a: unknown, j: number) => {
          if (!a || typeof a !== 'object') return null;
          const att = a as Record<string, unknown>;
          if (typeof att.type !== 'string' || !['image', 'file'].includes(att.type)) return null;
          if (typeof att.name !== 'string' || typeof att.data !== 'string') return null;
          return {
            type: att.type as 'image' | 'file',
            name: att.name,
            data: att.data,
            mimeType: typeof att.mimeType === 'string' ? att.mimeType : undefined,
          };
        }).filter(Boolean) as Message['attachments'];
      }
      return out;
    });
  }

  return result;
}

export async function GET() {
  try {
    const chats = listChats();
    return Response.json({ chats });
  } catch (error) {
    console.error('Chats list error:', error);
    return handleError(error).toResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Errors.badRequest('Invalid JSON in request body').toResponse();
    }

    const validated = validateCreateBody(body);
    const session = createChat(validated);
    return Response.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error('Chats create error:', error);
    return handleError(error).toResponse();
  }
}
