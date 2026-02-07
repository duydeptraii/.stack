'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PanelLeftClose, PanelLeft, Keyboard } from 'lucide-react';
import { ChatContainer, ChatHistorySidebar } from '@/components/chat';
import { CodePanel } from '@/components/code';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useChatHistory } from '@/hooks/useChatHistory';
import type { CodeContext, CodeFile } from '@/types';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';

// Sample code files for demonstration
const SAMPLE_FILES: CodeFile[] = [
  {
    id: '1',
    name: 'app.tsx',
    language: 'tsx',
    content: `import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!user) return null;

  return (
    <div className="space-y-4 p-6 rounded-lg border">
      <h2 className="text-2xl font-bold">{user.name}</h2>
      <p className="text-muted-foreground">{user.email}</p>
      <Button variant="outline">Edit Profile</Button>
    </div>
  );
}`,
  },
  {
    id: '2',
    name: 'utils.ts',
    language: 'typescript',
    content: `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}`,
  },
  {
    id: '3',
    name: 'api.py',
    language: 'python',
    content: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI(title="Sideview API")

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    code_context: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    tokens_used: int

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process chat messages and return AI response.
    """
    try:
        # Simulate AI processing
        await asyncio.sleep(0.5)
        
        response_text = f"Received {len(request.messages)} messages"
        if request.code_context:
            response_text += f" with code from {request.code_context.get('fileName', 'unknown')}"
        
        return ChatResponse(
            response=response_text,
            tokens_used=len(response_text.split())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}`,
  },
];

export default function Home() {
  const { setTheme, theme } = useTheme();
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [activeFileId, setActiveFileId] = useState(SAMPLE_FILES[0].id);
  const [codeContext, setCodeContext] = useState<CodeContext | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const {
    chats,
    activeChatId,
    isLoading: chatsLoading,
    loadChat,
    createChat,
    updateChat,
    deleteChat,
    clearActiveChat,
    activeChat,
  } = useChatHistory();

  useEffect(() => {
    if (activeChat) {
      setMessages(activeChat.messages ?? []);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const handleNewChat = useCallback(async () => {
    const id = await createChat();
    if (id) setMessages([]);
  }, [createChat]);

  const handleSelectChat = useCallback(
    (id: string) => {
      loadChat(id);
    },
    [loadChat]
  );

  useEffect(() => {
    if (!chatsLoading && chats.length === 0 && !activeChatId) {
      createChat();
    }
  }, [chatsLoading, chats.length, activeChatId, createChat]);

  // Handle code selection or generation
  const handleSelectionChat = useCallback((context: CodeContext) => {
    setCodeContext(context);
    setShowCodePanel(true); // Automatically show panel when context exists
  }, []);

  // Clear code context
  const handleClearContext = useCallback(() => {
    setCodeContext(null);
  }, []);

  // Toggle theme
  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
  }, [setTheme, theme]);

  // Toggle code panel
  const handleToggleCodePanel = useCallback(() => {
    setShowCodePanel((prev) => !prev);
  }, []);

  // Register global keyboard shortcuts
  useGlobalShortcuts({
    onToggleTheme: handleToggleTheme,
    onToggleCodePanel: handleToggleCodePanel,
  });

  return (
    <ErrorBoundary>
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-thin tracking-tight lowercase">
              .stack
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Code Panel */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={handleToggleCodePanel}
              aria-label={showCodePanel ? 'Hide code panel' : 'Show code panel'}
            >
              {showCodePanel ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>

            {/* Keyboard Shortcuts */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 overflow-hidden">
          {/* History Sidebar (left) */}
          <ChatHistorySidebar
            chats={chats}
            activeChatId={activeChatId}
            isLoading={chatsLoading}
            onSelect={handleSelectChat}
            onNewChat={handleNewChat}
            onDelete={deleteChat}
            className="h-full"
          />

          {/* Chat Panel - sync transition with code panel */}
          <div
            className={cn(
              'flex flex-col min-w-0',
              'transition-[flex,width,max-width] duration-300 ease-in-out',
              showCodePanel ? 'flex-[6]' : 'flex-1 max-w-3xl mx-auto w-full'
            )}
          >
            <ChatContainer
              messages={messages}
              onMessagesChange={setMessages}
              activeChatId={activeChatId}
              onSaveChat={updateChat}
              codeContext={codeContext}
              onClearContext={handleClearContext}
              onCodeAction={handleSelectionChat}
              className="h-full"
            />
          </div>

          {/* Code Panel - 40% when visible, smooth transition on close */}
          <div
            className={cn(
              'hidden overflow-hidden border-l border-border min-w-0 md:block',
              'transition-[flex,width] duration-300 ease-in-out',
              showCodePanel ? 'flex-[4]' : 'w-0 flex-none overflow-hidden'
            )}
          >
            <div className={cn('h-full w-full transition-opacity duration-200', !showCodePanel && 'opacity-0 pointer-events-none')}>
              <CodePanel
                files={SAMPLE_FILES}
                activeFileId={activeFileId}
                onFileChange={setActiveFileId}
                onSelectionChat={handleSelectionChat}
                className="h-full"
              />
            </div>
          </div>
        </main>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowShortcuts(false)}
          >
            <div
              className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setShowShortcuts(false)}
                >
                  <span className="sr-only">Close</span>
                  ×
                </Button>
              </div>
              <div className="space-y-3">
                <ShortcutItem keys={['/']} description="Focus chat input" />
                <ShortcutItem keys={['Ctrl', 'B']} description="Toggle code panel" />
                <ShortcutItem keys={['Ctrl', 'Shift', 'T']} description="Cycle theme" />
                <ShortcutItem keys={['Enter']} description="Send message" />
                <ShortcutItem keys={['Shift', 'Enter']} description="New line in input" />
                <ShortcutItem keys={['Esc']} description="Clear selection / Close modal" />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Code Panel Toggle (visible on small screens) */}
        <div className="fixed bottom-20 right-4 md:hidden">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-lg cursor-pointer"
            onClick={handleToggleCodePanel}
            aria-label={showCodePanel ? 'Hide code' : 'Show code'}
          >
            {showCodePanel ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Keyboard shortcut display component
function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
