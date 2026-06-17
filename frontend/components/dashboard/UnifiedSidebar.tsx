'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Loader2,
  Settings2,
  Cpu,
  Thermometer,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

import { useChatStore } from '@/store/chatStore';
import { useChatSessions, useDeleteSession, useCreateSession } from '@/lib/hooks/useChat';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { SessionListItem } from '@/components/chat/SessionListItem';
import type { ChatSession } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function UnifiedSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const {
    currentSessionId,
    setCurrentSession,
    clearMessages,
    activeModel,
    temperature,
    topK,
    setActiveModel,
    setTemperature,
    setTopK,
  } = useChatStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localTopK, setLocalTopK] = useState(topK);
  const debouncedTemperature = useDebounce(localTemperature, 300);
  const debouncedTopK = useDebounce(localTopK, 300);

  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();

  // Update store when debounced values change
  useEffect(() => {
    if (debouncedTemperature !== temperature) {
      setTemperature(debouncedTemperature);
    }
  }, [debouncedTemperature, temperature, setTemperature]);

  useEffect(() => {
    if (debouncedTopK !== topK) {
      setTopK(debouncedTopK);
    }
  }, [debouncedTopK, topK, setTopK]);

  // Sync local state when store changes
  useEffect(() => {
    setLocalTemperature(temperature);
  }, [temperature]);

  useEffect(() => {
    setLocalTopK(topK);
  }, [topK]);

  const getTempDescription = (temp: number) => {
    if (temp <= 0.2) return 'Precise';
    if (temp <= 0.6) return 'Balanced';
    return 'Creative';
  };
  const deleteMutation = useDeleteSession();
  const createSessionMutation = useCreateSession();

  const isChatPage = pathname?.startsWith('/chat');

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewChat = () => {
    if (createSessionMutation.isPending) return;
    createSessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setCurrentSession(session.id);
        clearMessages();
        router.push(`/chat/${session.id}`);
        if (window.innerWidth < 768) setIsMobileOpen(false);
      },
      onError: (err) => {
        console.error('Failed to create new session, falling back to /chat page', err);
        setCurrentSession(null);
        clearMessages();
        router.push('/chat');
        if (window.innerWidth < 768) setIsMobileOpen(false);
      }
    });
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentSession(sessionId);
    router.push(`/chat/${sessionId}`);
    if (window.innerWidth < 768) setIsMobileOpen(false);
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



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Sidebar (Desktop only) */}
      <aside
        className={cn(
          'bg-surface/50 border-r border-white/10 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out z-40 relative shadow-2xl shadow-black/25',
          isCollapsed ? 'w-20' : 'w-72',
          'hidden md:flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between min-h-[73px]">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <img src="/lumina_logo.png" alt="Lumina Logo" className="h-full w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-text-primary uppercase tracking-wide">Lumina</h1>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium">Knowledge Assistant</p>
              </div>
            </div>
          )}

          {/* Collapse button (desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1.5 border-b border-white/10">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-primary/30 text-white shadow-md shadow-primary/5'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border-transparent'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Active side indicator */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator" 
                    className="absolute left-0 top-1/4 bottom-1/4 w-0.75 rounded-r-md bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="font-semibold text-sm">{item.name}</span>}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-surface-secondary rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap text-xs z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Chat Sessions (only on chat page) */}
        {isChatPage && !isCollapsed && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conversations Header & List */}
            <div className="px-3 py-3 flex items-center justify-between">
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {showConversations ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
                <span>Conversations</span>
              </button>

              <button
                onClick={handleNewChat}
                disabled={createSessionMutation.isPending}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50 text-text-secondary hover:text-primary cursor-pointer"
                title="New Chat"
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>

            {showConversations && (
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                  </div>
                ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
                  sessionsData.sessions.map((session: ChatSession) => (
                    <SessionListItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => handleSessionClick(session.id)}
                      onDelete={(e) => handleDeleteClick(e, session.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 px-4 bg-white/[0.02] border border-white/5 rounded-2xl mx-1.5">
                    <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-text-muted">No conversations yet</p>
                    <button
                      onClick={handleNewChat}
                      disabled={createSessionMutation.isPending}
                      className="mt-3 text-xs text-primary hover:underline font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {createSessionMutation.isPending ? 'Starting...' : 'Start your first chat'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/85 backdrop-blur-xl border-t border-white/10 md:hidden flex justify-around items-center h-16 px-4 pb-safe shadow-2xl">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95",
                isActive ? "text-primary font-bold" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <div className="relative flex items-center justify-center p-1">
                <item.icon className={cn("w-5.5 h-5.5 transition-colors", isActive ? "text-primary" : "text-text-muted")} />
                {isActive && (
                  <motion.div
                    layoutId="activeBottomNavIndicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[9px] tracking-wide mt-1 font-semibold uppercase">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Delete confirmation dialog */}
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
