'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Send, Code, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CodeContext } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string, codeContext?: CodeContext) => void;
  codeContext?: CodeContext | null;
  onClearContext?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  codeContext,
  onClearContext,
  isLoading,
  placeholder = 'Ask a question... (Press / to focus)',
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Focus on mount and when / is pressed (handled by parent)
  const focus = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  // Expose focus method via ref
  useEffect(() => {
    const handleFocusShortcut = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        focus();
      }
    };
    window.addEventListener('keydown', handleFocusShortcut);
    return () => window.removeEventListener('keydown', handleFocusShortcut);
  }, [focus]);

  const handleSubmit = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || isLoading) return;

    onSend(trimmedValue, codeContext || undefined);
    setValue('');
    onClearContext?.();
  }, [value, isLoading, onSend, codeContext, onClearContext]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Code Context Badge */}
      {codeContext && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 animate-fade-in">
          <Code className="h-4 w-4 text-accent" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-foreground">
              {codeContext.fileName}
            </span>
            <span className="mx-2 text-xs text-muted-foreground">
              Lines {codeContext.startLine}-{codeContext.endLine}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {codeContext.language}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-pointer hover:bg-muted"
            onClick={onClearContext}
            aria-label="Clear code context"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload code file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="min-h-[36px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
          rows={1}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  'h-9 w-9 shrink-0 cursor-pointer transition-all duration-200',
                  value.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground'
                )}
                onClick={handleSubmit}
                disabled={!value.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message (Enter)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-muted-foreground/60">
        Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to send,{' '}
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
