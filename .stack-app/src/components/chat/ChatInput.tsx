'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, Code, X, Paperclip, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CodeContext, Attachment } from '@/types';
import { cn } from '@/lib/utils';

const ACCEPTED_IMAGE_TYPES = 'image/*';
const ACCEPTED_FILE_TYPES = '.txt,.md,.json,.csv,.log,.py,.ts,.tsx,.js,.jsx,.html,.css';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface ChatInputProps {
  onSend: (message: string, codeContext?: CodeContext, attachments?: Attachment[]) => void;
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64 ?? '');
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

  const isImageFile = (file: File) => file.type.startsWith('image/');

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      setAttachError(null);
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isImageFile(file)) {
          if (file.size > MAX_IMAGE_SIZE) {
            setAttachError(`Image ${file.name} exceeds 5MB limit`);
            continue;
          }
          try {
            const data = await readFileAsBase64(file);
            newAttachments.push({
              type: 'image',
              name: file.name,
              data,
              mimeType: file.type,
            });
          } catch {
            setAttachError(`Failed to read image ${file.name}`);
          }
        } else {
          if (file.size > MAX_FILE_SIZE) {
            setAttachError(`File ${file.name} exceeds 10MB limit`);
            continue;
          }
          try {
            const data = await readFileAsText(file);
            newAttachments.push({
              type: 'file',
              name: file.name,
              data,
              mimeType: file.type,
            });
          } catch {
            setAttachError(`Failed to read file ${file.name}`);
          }
        }
      }
      if (newAttachments.length) {
        setAttachments((prev) => [...prev, ...newAttachments]);
      }
      e.target.value = '';
    },
    []
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
    if ((!trimmedValue && attachments.length === 0) || isLoading) return;

    const content = trimmedValue || `[Attached ${attachments.length} file(s)]`;
    onSend(content, codeContext || undefined, attachments.length ? attachments : undefined);
    setValue('');
    setAttachments([]);
    onClearContext?.();
  }, [value, attachments, isLoading, onSend, codeContext, onClearContext]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={`${ACCEPTED_IMAGE_TYPES},${ACCEPTED_FILE_TYPES}`}
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="Attach files or images"
      />

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 px-3 py-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5',
                att.type === 'image' ? 'max-w-[120px]' : ''
              )}
            >
              {att.type === 'image' ? (
                <img
                  src={`data:${att.mimeType ?? 'image/png'};base64,${att.data}`}
                  alt={att.name}
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate max-w-[80px] text-xs" title={att.name}>
                {att.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 cursor-pointer"
                onClick={() => removeAttachment(i)}
                aria-label={`Remove ${att.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {attachError && (
        <p className="text-xs text-destructive">{attachError}</p>
      )}

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
                onClick={handleAttachClick}
                type="button"
                aria-label="Attach files or images"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach files or images</p>
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
                  (value.trim() || attachments.length > 0)
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground'
                )}
                onClick={handleSubmit}
                disabled={(!value.trim() && attachments.length === 0) || isLoading}
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
