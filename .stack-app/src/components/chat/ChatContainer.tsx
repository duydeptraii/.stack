'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ErrorBoundary, ErrorMessage } from '@/components/error/ErrorBoundary';
import type { Message, CodeContext, Attachment } from '@/types';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  activeChatId: string | null;
  onSaveChat?: (chatId: string, updates: { title?: string; messages?: Message[] }) => void;
  codeContext?: CodeContext | null;
  onClearContext?: () => void;
  onCodeAction?: (context: CodeContext) => void;
  className?: string;
}

export function ChatContainer({
  messages,
  onMessagesChange,
  activeChatId,
  onSaveChat,
  codeContext,
  onClearContext,
  onCodeAction,
  className,
}: ChatContainerProps) {
  const [isLoading, setIsLoading] = useState(false);
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
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const lowercaseContent = content.toLowerCase();
        const triggersCode = lowercaseContent.includes('code') ||
          lowercaseContent.includes('explain') ||
          lowercaseContent.includes('function') ||
          lowercaseContent.includes('how to');

        if (triggersCode && onCodeAction) {
          onCodeAction({
            fileName: 'app.tsx',
            language: 'tsx',
            selectedCode: '...',
            startLine: 1,
            endLine: 10,
          });
        }

        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: generateMockResponse(content, context, attachments),
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        applyMessages(finalMessages);
      } catch (err) {
        setError('Failed to get response. Please try again.');
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, applyMessages, onCodeAction]
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
            messages={messages}
            isLoading={isLoading}
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

// Mock response generator (replace with actual API integration)
function generateMockResponse(userMessage: string, context?: CodeContext, attachments?: Attachment[]): string {
  if (attachments?.length) {
    const files = attachments.map((a) => a.name).join(', ');
    return `I've received your message${userMessage ? `: "${userMessage.slice(0, 50)}..."` : ''} along with ${attachments.length} attachment(s): ${files}.\n\nI can help you analyze the content, explain code, or answer questions about these files. What would you like to know?`;
  }
  if (context) {
    return `I can see you've selected code from **${context.fileName}** (lines ${context.startLine}-${context.endLine}).

Here's what I notice about this ${context.language} code:

\`\`\`${context.language}
${context.selectedCode.slice(0, 200)}${context.selectedCode.length > 200 ? '...' : ''}
\`\`\`

The code looks well-structured. Would you like me to:
- Explain what it does
- Suggest improvements
- Find potential bugs
- Add documentation`;
  }

  const responses = [
    `That's a great question! Based on your query about "${userMessage.slice(0, 50)}...", I'd recommend considering the following approach...`,
    `I understand you're asking about \`${userMessage.split(' ').slice(0, 3).join(' ')}\`. Here's what I can help with...`,
    `Let me help you with that. To address your question effectively, I'll need to consider a few factors...`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// Export for barrel file
export { ChatInput } from './ChatInput';
export { MessageList } from './MessageList';
export { MessageBubble } from './MessageBubble';
