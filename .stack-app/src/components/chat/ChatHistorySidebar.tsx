'use client';

import { useState } from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatHistoryList } from './ChatHistoryList';
import type { ChatListItem } from '@/types/chat-history';
import { cn } from '@/lib/utils';

interface ChatHistorySidebarProps {
  chats: ChatListItem[];
  activeChatId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  defaultCollapsed?: boolean;
  className?: string;
}

const SIDEBAR_WIDTH = 240;

export function ChatHistorySidebar({
  chats,
  activeChatId,
  isLoading,
  onSelect,
  onNewChat,
  onDelete,
  defaultCollapsed = false,
  className,
}: ChatHistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'flex border-r border-border bg-background/50 transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-12' : `w-[${SIDEBAR_WIDTH}px]`,
        className
      )}
      style={{ width: collapsed ? 48 : SIDEBAR_WIDTH }}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground">History</span>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setCollapsed((c) => !c)}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{collapsed ? 'Expand history' : 'Collapse history'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden p-3">
            <ChatHistoryList
              chats={chats}
              activeChatId={activeChatId}
              isLoading={isLoading}
              onSelect={onSelect}
              onNewChat={onNewChat}
              onDelete={onDelete}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
