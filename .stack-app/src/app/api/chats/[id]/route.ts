/**
 * GET /api/chats/[id] - Get single chat session
 * PATCH /api/chats/[id] - Update chat session
 * DELETE /api/chats/[id] - Delete chat session
 */

import { NextRequest } from 'next/server';
import { ApiError, Errors, handleError } from '@/lib/errors';
import { getChat, updateChat, deleteChat } from '../store';
import type { UpdateChatBody } from '@/types/chat-history';
import type { Message } from '@/types';

function validateUpdateBody(body: unknown): UpdateChatBody {
  if (!body || typeof body !== 'object') {
    throw Errors.validation('Request body must be an object');
  }
  const b = body as Record<string, unknown>;

  const result: UpdateChatBody = {};

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getChat(id);
    if (!session) {
      return Errors.notFound('Chat').toResponse();
    }
    return Response.json(session);
  } catch (error) {
    console.error('Chat get error:', error);
    return handleError(error).toResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = getChat(id);
    if (!existing) {
      return Errors.notFound('Chat').toResponse();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Errors.badRequest('Invalid JSON in request body').toResponse();
    }

    const validated = validateUpdateBody(body);
    const session = updateChat(id, validated);
    if (!session) {
      return Errors.notFound('Chat').toResponse();
    }
    return Response.json(session);
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error('Chat update error:', error);
    return handleError(error).toResponse();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existed = deleteChat(id);
    if (!existed) {
      return Errors.notFound('Chat').toResponse();
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Chat delete error:', error);
    return handleError(error).toResponse();
  }
}
