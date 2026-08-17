import React from 'react';
import { Thread } from '@/hooks/useThreads';
import { cn } from '@/lib/utils';
import { Pin, Loader2, Trash, MoreHorizontal } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LibraryPopoutProps {
  threads: Thread[];
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  isLoading: boolean;
  isVisible: boolean;
  currentThreadId?: string | null;
  onMenuOpenChange?: (open: boolean) => void;
}

export const LibraryPopout: React.FC<LibraryPopoutProps> = ({ 
  threads, 
  onSelectThread,
  onDeleteThread, 
  isLoading,
  isVisible,
  currentThreadId,
  onMenuOpenChange
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute left-[72px] top-0 bottom-0 w-64 bg-background border-r border-border/40 shadow-xl z-40 flex flex-col animate-in slide-in-from-left-2 duration-200">
      <div className="p-4 flex items-center justify-between border-b border-border/40">
        <h2 className="font-medium text-sm flex items-center gap-2">
          Library
        </h2>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Pin size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-muted-foreground" size={16} />
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No threads yet
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
              Recent
            </div>
            {threads.map((thread) => (
              <ContextMenu key={thread.id} onOpenChange={onMenuOpenChange}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "group relative flex items-center w-full hover:bg-muted/50 transition-colors cursor-pointer pr-8",
                      thread.id === currentThreadId && "bg-muted/40"
                    )}
                  >
                    <button
                      onClick={() => onSelectThread(thread.id)}
                      className="flex-1 text-left pl-4 py-2 text-sm text-foreground/80 hover:text-foreground w-full block overflow-hidden outline-none"
                      title={thread.title}
                    >
                      <span 
                        className="block whitespace-nowrap overflow-hidden" 
                        style={{ 
                          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)', 
                          WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' 
                        }}
                      >
                        {thread.title}
                      </span>
                    </button>

                    <DropdownMenu onOpenChange={onMenuOpenChange} modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-all focus:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.stopPropagation();
                            onDeleteThread(thread.id);
                          }}
                          className="gap-2 text-destructive focus:text-destructive focus:bg-muted cursor-pointer"
                        >
                          <Trash size={14} />
                          Delete Thread
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                  <ContextMenuItem 
                    onSelect={() => onDeleteThread(thread.id)}
                    className="gap-2 text-destructive focus:text-destructive focus:bg-muted cursor-pointer"
                  >
                    <Trash size={14} />
                    Delete Thread
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border/40">
        <button className="w-full text-xs text-muted-foreground hover:text-primary transition-colors text-left px-2">
          View All
        </button>
      </div>
    </div>
  );
};