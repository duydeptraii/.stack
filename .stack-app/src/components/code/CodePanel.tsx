'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import {
  FileCode,
  Copy,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CodeFile, CodeContext } from '@/types';
import { cn } from '@/lib/utils';

interface CodePanelProps {
  files: CodeFile[];
  activeFileId?: string;
  onFileChange?: (fileId: string) => void;
  onSelectionChat?: (context: CodeContext) => void;
  className?: string;
}

export function CodePanel({
  files,
  activeFileId,
  onFileChange,
  onSelectionChat,
  className,
}: CodePanelProps) {
  const { resolvedTheme } = useTheme();
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [lastPopupPosition, setLastPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const isDark = resolvedTheme === 'dark';

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText('');
      setSelectionRange(null);
      setPopupPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (text && codeRef.current?.contains(selection.anchorNode)) {
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      const preElement = codeRef.current;
      const preRect = preElement.getBoundingClientRect();

      // Calculate relative position for the popup
      // Place it above the selection, slightly to the right
      const pos = {
        top: rangeRect.top - 50, // 50px above the top of selection
        left: rangeRect.left + (rangeRect.width / 2),
      };
      setPopupPosition(pos);
      setLastPopupPosition(pos);

      // Estimate line numbers based on position
      const lineHeight = 24; // Approximate line height
      const startLine = Math.max(1, Math.floor((rangeRect.top - preRect.top) / lineHeight) + 1);
      const endLine = Math.max(startLine, Math.ceil((rangeRect.bottom - preRect.top) / lineHeight));

      setSelectionRange({ start: startLine, end: endLine });
    }
  }, []);

  // Chat actions
  const handleAction = useCallback((action: 'explain' | 'ask') => {
    if (!selectedText || !selectionRange || !activeFile) return;

    const context: CodeContext = {
      fileName: activeFile.name,
      language: activeFile.language,
      selectedCode: selectedText,
      startLine: selectionRange.start,
      endLine: selectionRange.end,
    };

    if (action === 'explain') {
      onSelectionChat?.({
        ...context,
        initialMessage: `Explain this code snippet from ${activeFile.name}:`
      });
    } else {
      onSelectionChat?.(context);
    }

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setSelectionRange(null);
    setPopupPosition(null);
  }, [selectedText, selectionRange, activeFile, onSelectionChat]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    const textToCopy = selectedText || activeFile?.content || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedText, activeFile?.content]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowFileDropdown(false);
    if (showFileDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFileDropdown]);

  if (!activeFile) {
    return (
      <div className={cn('flex h-full items-center justify-center bg-card', className)}>
        <div className="text-center text-muted-foreground">
          <FileCode className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No files to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col bg-card border-l border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/30">
        {/* File Selector */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 cursor-pointer hover:bg-background font-bold text-xs uppercase tracking-widest"
            onClick={(e) => {
              e.stopPropagation();
              setShowFileDropdown(!showFileDropdown);
            }}
          >
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-mono">{activeFile.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>

          {/* Dropdown */}
          {showFileDropdown && files.length > 1 && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-md border border-border bg-popover py-1 shadow-lg animate-fade-in">
              {files.map((file) => (
                <button
                  key={file.id}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer transition-colors hover:bg-muted',
                    file.id === activeFile.id && 'bg-muted'
                  )}
                  onClick={() => {
                    onFileChange?.(file.id);
                    setShowFileDropdown(false);
                  }}
                >
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{file.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? 'Copied!' : selectedText ? 'Copy selection' : 'Copy all'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Floating Selection Popup */}
      <div
        className={cn(
          "fixed z-[100] flex items-center gap-1 rounded-md border border-black dark:border-white bg-white dark:bg-black p-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 ease-out -translate-x-1/2",
          popupPosition && selectedText
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        style={{
          top: `${(popupPosition || lastPopupPosition)?.top || 0}px`,
          left: `${(popupPosition || lastPopupPosition)?.left || 0}px`,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none text-black dark:text-white"
          onClick={() => handleAction('explain')}
        >
          Explain code
        </Button>
        <div className="h-3 w-[1px] bg-black/10 dark:bg-white/20 mx-0.5" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none text-black dark:text-white"
          onClick={() => handleAction('ask')}
        >
          Ask about this
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-none"
          onClick={() => {
            window.getSelection()?.removeAllRanges();
            setSelectedText('');
            setPopupPosition(null);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Code Content */}
      <ScrollArea className="flex-1">
        <div className="relative" onMouseUp={handleMouseUp}>
          <Highlight
            theme={isDark ? themes.vsDark : themes.vsLight}
            code={activeFile.content}
            language={activeFile.language as never}
          >
            {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                ref={codeRef}
                className={cn(
                  highlightClassName,
                  'overflow-x-auto p-4 text-sm leading-6 font-mono'
                )}
                style={{ ...style, background: 'transparent' }}
              >
                {tokens.map((line, i) => {
                  const lineProps = getLineProps({ line, key: i });
                  return (
                    <div
                      key={i}
                      {...lineProps}
                      className={cn(lineProps.className, 'table-row')}
                    >
                      {/* Line Number */}
                      <span className="table-cell select-none pr-4 text-right text-muted-foreground/50 w-12">
                        {i + 1}
                      </span>
                      {/* Code */}
                      <span className="table-cell">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </ScrollArea>
    </div>
  );
}
