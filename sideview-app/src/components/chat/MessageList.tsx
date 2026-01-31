'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from '@/components/error/ErrorBoundary';
import type { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({ messages, isLoading, className }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Start a conversation"
          description="Ask a question or select code from the panel to discuss"
        />
      </div>
    );
  }

  return (
    <ScrollArea className={className} ref={scrollAreaRef}>
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading indicator for streaming response */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <div className="h-4 w-4 animate-pulse-subtle">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="4" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="20" cy="12" r="2" />
                </svg>
              </div>
            </div>
            <div className="flex max-w-[80%] items-center rounded-2xl rounded-tl-md bg-card px-4 py-3 border border-border">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
