'use client';

import { useState, useCallback } from 'react';
import { MessageSquarePlus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatListItem } from '@/types/chat-history';
import { cn } from '@/lib/utils';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

interface ChatHistoryListProps {
  chats: ChatListItem[];
  activeChatId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function ChatHistoryList({
  chats,
  activeChatId,
  isLoading,
  onSelect,
  onNewChat,
  onDelete,
  className,
}: ChatHistoryListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = useCallback(
    (id: string) => {
      if (deleteConfirmId === id) {
        onDelete(id);
        setDeleteConfirmId(null);
      } else {
        setDeleteConfirmId(id);
        setTimeout(() => setDeleteConfirmId(null), 2000);
      }
    },
    [deleteConfirmId, onDelete]
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 mb-3 cursor-pointer"
        onClick={onNewChat}
      >
        <MessageSquarePlus className="h-4 w-4 shrink-0" />
        New Chat
      </Button>

      <ScrollArea className="flex-1 -mx-2 px-2">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No chats yet. Start a new conversation.
          </div>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors',
                  activeChatId === chat.id
                    ? 'bg-primary/15 text-foreground'
                    : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onSelect(chat.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{chat.title || 'New Chat'}</p>
                  <p className="text-xs opacity-70">{formatDate(chat.updatedAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
                    deleteConfirmId === chat.id && 'opacity-100 text-destructive'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(chat.id);
                  }}
                  aria-label={deleteConfirmId === chat.id ? 'Confirm delete' : 'Delete chat'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {deleteConfirmId && (
        <p className="text-xs text-muted-foreground mt-2 px-2">
          Click delete again to confirm
        </p>
      )}
    </div>
  );
}
