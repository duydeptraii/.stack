'use client';

import { memo } from 'react';
import { User, Bot, Code } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <div
      className={cn(
        'group flex gap-3 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-accent text-accent-foreground'
            : isSystem
            ? 'bg-muted text-muted-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex max-w-[80%] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Code Context Badge */}
        {message.codeContext && (
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Code className="h-3 w-3" />
            <span className="font-mono">{message.codeContext.fileName}</span>
            <span className="text-muted-foreground/60">
              L{message.codeContext.startLine}-{message.codeContext.endLine}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed space-y-2',
            isUser
              ? 'rounded-tr-md bg-accent text-accent-foreground'
              : isSystem
              ? 'rounded-tl-md bg-muted text-muted-foreground italic'
              : 'rounded-tl-md bg-card text-card-foreground border border-border'
          )}
        >
          {/* Attached images */}
          {message.attachments?.filter((a) => a.type === 'image').length ? (
            <div className="flex flex-wrap gap-2">
              {message.attachments
                .filter((a) => a.type === 'image')
                .map((att, i) => (
                  <img
                    key={i}
                    src={`data:${att.mimeType ?? 'image/png'};base64,${att.data}`}
                    alt={att.name}
                    className="max-h-40 max-w-full rounded-lg object-contain"
                  />
                ))}
            </div>
          ) : null}
          {/* Attached files indicator */}
          {message.attachments?.filter((a) => a.type === 'file').length ? (
            <div className="flex flex-wrap gap-1 text-xs opacity-90">
              {message.attachments
                .filter((a) => a.type === 'file')
                .map((att, i) => (
                  <span key={i} className="rounded bg-black/10 px-1.5 py-0.5 font-mono dark:bg-white/10">
                    {att.name}
                  </span>
                ))}
            </div>
          ) : null}
          {/* Render code blocks specially */}
          <MessageContent content={message.content} />
        </div>

        {/* Timestamp */}
        <span className="px-1 text-xs text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MessageBubble = memo(MessageBubbleComponent);

// Parse and render message content with code blocks
function MessageContent({ content }: { content: string }) {
  // Simple markdown-like parsing for code blocks
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        // Multi-line code block
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const language = lines[0].trim() || 'plaintext';
          const code = lines.slice(1).join('\n').trim();

          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg bg-[hsl(var(--syntax-bg))] p-3 text-xs"
            >
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {language}
              </div>
              <code className="font-mono text-[hsl(var(--syntax-text))]">
                {code}
              </code>
            </pre>
          );
        }

        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Regular text
        if (part.trim()) {
          return <span key={index}>{part}</span>;
        }

        return null;
      })}
    </div>
  );
}
