'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionListItem } from './SessionListItem';
import { useChatSessions, useDeleteSession, useCreateSession } from '@/lib/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import type { ChatSession } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConversationSidebarProps {
  currentSessionId: string | null;
}

export function ConversationSidebar({ currentSessionId }: ConversationSidebarProps) {
  const router = useRouter();
  const { data: sessionsData, isLoading } = useChatSessions();
  const deleteMutation = useDeleteSession();
  const createSessionMutation = useCreateSession();
  const { setCurrentSession, clearMessages } = useChatStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleNewChat = () => {
    if (createSessionMutation.isPending) return;
    createSessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setCurrentSession(session.id);
        clearMessages();
        router.push(`/chat/${session.id}`);
      },
      onError: (err) => {
        console.error('Failed to create new session, falling back to /chat page', err);
        setCurrentSession(null);
        clearMessages();
        router.push('/chat');
      }
    });
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentSession(sessionId);
    router.push(`/chat/${sessionId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete, {
        onSuccess: () => {
          if (sessionToDelete === currentSessionId) {
            handleNewChat();
          }
          setDeleteDialogOpen(false);
          setSessionToDelete(null);
        },
      });
    }
  };

  return (
    <>
      <div className="w-64 bg-surface/80 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.15)]">
        <div className="p-4 border-b border-white/10">
          <Button
            onClick={handleNewChat}
            disabled={createSessionMutation.isPending}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/85 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            {createSessionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <div className="space-y-1">
              {sessionsData.sessions.map((session: ChatSession) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onClick={() => handleSessionClick(session.id)}
                  onDelete={(e) => handleDeleteClick(e, session.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-text-muted">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
