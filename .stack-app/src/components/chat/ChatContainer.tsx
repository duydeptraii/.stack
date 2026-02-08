'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ErrorBoundary, ErrorMessage } from '@/components/error/ErrorBoundary';
import type { Message, CodeContext, Attachment } from '@/types';
import type { ModelId } from '@/types/chat';
import { cn } from '@/lib/utils';

const DEFAULT_MODEL: ModelId = 'gpt-4o';

interface ChatContainerProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  activeChatId: string | null;
  onSaveChat?: (chatId: string, updates: { title?: string; messages?: Message[] }) => void;
  codeContext?: CodeContext | null;
  onClearContext?: () => void;
  onCodeAction?: (context: CodeContext) => void;
  model?: ModelId;
  className?: string;
}

function buildApiMessages(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((m) => {
    let content = m.content;
    if (m.attachments?.length) {
      const parts: string[] = [content].filter(Boolean);
      for (const att of m.attachments) {
        if (att.type === 'file') {
          parts.push(`\n[File: ${att.name}]\n${att.data}`);
        } else {
          parts.push(`\n[Image attached: ${att.name}]`);
        }
      }
      content = parts.join('\n').trim();
    }
    return { role: m.role as 'user' | 'assistant', content };
  });
}

function buildApiCodeContext(context?: CodeContext | null): { fullCode: string; selectedPortion: string; language: string; filename: string } | undefined {
  if (!context) return undefined;
  return {
    fullCode: context.selectedCode,
    selectedPortion: context.selectedCode,
    language: context.language,
    filename: context.fileName,
  };
}

async function streamChatResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  model: ModelId,
  codeContext: { fullCode: string; selectedPortion: string; language: string; filename: string } | undefined,
  onChunk?: (text: string) => void
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, codeContext, stream: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk?.(fullText);
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }

  return fullText;
}

export function ChatContainer({
  messages,
  onMessagesChange,
  activeChatId,
  onSaveChat,
  codeContext,
  onClearContext,
  onCodeAction,
  model = DEFAULT_MODEL,
  className,
}: ChatContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applyMessages = useCallback(
    (newMessages: Message[], title?: string) => {
      onMessagesChange(newMessages);
      if (activeChatId && onSaveChat) {
        onSaveChat(activeChatId, { messages: newMessages, ...(title !== undefined && { title }) });
      }
    },
    [activeChatId, onMessagesChange, onSaveChat]
  );

  const handleSend = useCallback(
    async (content: string, context?: CodeContext, attachments?: Attachment[]) => {
      setError(null);
      setStreamingContent('');

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        codeContext: context,
        ...(attachments?.length && { attachments }),
      };

      const updatedMessages = [...messages, userMessage];
      const title = messages.length === 0 && content.trim()
        ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
        : undefined;
      applyMessages(updatedMessages, title);
      setIsLoading(true);

      try {
        const apiMessages = buildApiMessages(updatedMessages);
        const apiCodeContext = buildApiCodeContext(context ?? codeContext);

        const assistantContent = await streamChatResponse(
          apiMessages,
          model,
          apiCodeContext,
          (text) => setStreamingContent(text)
        );

        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        applyMessages(finalMessages);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to get response. Please try again.';
        setError(msg);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
        setStreamingContent('');
      }
    },
    [messages, applyMessages, codeContext, model]
  );

  // Handle auto-trigger messages from code context
  useEffect(() => {
    if (codeContext?.initialMessage) {
      handleSend(codeContext.initialMessage, codeContext);
      onClearContext?.();
    }
  }, [codeContext, handleSend, onClearContext]);

  const handleRetry = useCallback(() => {
    setError(null);
    // Could re-send the last message here
  }, []);

  return (
    <ErrorBoundary>
      <div className={cn('flex h-full flex-col', className)}>
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={isLoading && streamingContent ? [...messages, { id: 'streaming', role: 'assistant' as const, content: streamingContent, timestamp: new Date() }] : messages}
            isLoading={isLoading && !streamingContent}
            className="h-full"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 pb-2">
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-background p-4">
          <ChatInput
            onSend={handleSend}
            codeContext={codeContext}
            onClearContext={onClearContext}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Export for barrel file
export { ChatInput } from './ChatInput';
export { MessageList } from './MessageList';
export { MessageBubble } from './MessageBubble';
