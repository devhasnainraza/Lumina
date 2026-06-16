'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Settings2, Cpu, Thermometer, Database, GripVertical, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SessionListItem } from './SessionListItem';
import { useChatSessions, useDeleteSession, useCreateSession } from '@/lib/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { ChatSession } from '@/types/chat';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ResizableChatSidebarProps {
  currentSessionId: string | null;
}

export function ResizableChatSidebar({ currentSessionId }: ResizableChatSidebarProps) {
  const router = useRouter();
  const { data: sessionsData, isLoading } = useChatSessions();
  const deleteMutation = useDeleteSession();
  const createSessionMutation = useCreateSession();
  const {
    setCurrentSession,
    clearMessages,
    activeModel,
    temperature,
    topK,
    setActiveModel,
    setTemperature,
    setTopK,
  } = useChatStore();

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localTopK, setLocalTopK] = useState(topK);
  const debouncedTemperature = useDebounce(localTemperature, 300);
  const debouncedTopK = useDebounce(localTopK, 300);

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('chatSidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

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

  // Resize handlers
  const startResizing = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Constrain between 240px and 500px
      if (newWidth >= 240 && newWidth <= 500) {
        setSidebarWidth(newWidth);
        localStorage.setItem('chatSidebarWidth', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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

  const getTempDescription = (temp: number) => {
    if (temp <= 0.2) return 'Precise';
    if (temp <= 0.6) return 'Balanced';
    return 'Creative';
  };

  return (
    <>
      <div
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className="relative bg-surface/80 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-[2px_0_12px_rgba(0,0,0,0.15)] transition-none"
      >
        {/* New Chat Button & Home Link */}
        <div className="p-4 border-b border-white/10 space-y-2">
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
          <Button
            onClick={() => router.push('/documents')}
            variant="outline"
            className="w-full border-white/10 hover:bg-surface-secondary/70 hover:border-primary/30 transition-all duration-200"
          >
            <FileText className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Settings Toggle */}
        <div className="px-4 py-3 border-b border-white/10">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-secondary/70 transition-all text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span>AI Settings</span>
            </div>
            <motion.div
              animate={{ rotate: showSettings ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <GripVertical className="w-4 h-4" />
            </motion.div>
          </button>

          {/* Settings Panel */}
          <motion.div
            initial={false}
            animate={{ height: showSettings ? 'auto' : 0, opacity: showSettings ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  Model
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setActiveModel('gemini-1.5-pro')}
                    className={`w-full px-3 py-2 rounded-lg border text-left transition-all text-xs ${
                      activeModel === 'gemini-1.5-pro'
                        ? 'bg-primary/10 border-primary/40 text-white ring-1 ring-primary/30'
                        : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold">Gemini 1.5 Pro</div>
                    <div className="text-[10px] text-text-muted mt-0.5">High accuracy</div>
                  </button>
                  <button
                    onClick={() => setActiveModel('llama-3.3-70b-versatile')}
                    className={`w-full px-3 py-2 rounded-lg border text-left transition-all text-xs ${
                      activeModel === 'llama-3.3-70b-versatile'
                        ? 'bg-primary/10 border-primary/40 text-white ring-1 ring-primary/30'
                        : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold">Llama 3.3 70B</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Fast & logical</div>
                  </button>
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Thermometer className="w-3 h-3" />
                    Creativity
                  </label>
                  <span className="text-xs text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                    {localTemperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localTemperature}
                  onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(124, 58, 237) 0%, rgb(124, 58, 237) ${localTemperature * 100}%, rgba(255,255,255,0.1) ${localTemperature * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="text-center text-[10px] text-primary font-medium">
                  {getTempDescription(localTemperature)}
                </div>
              </div>

              {/* Top K */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    Context
                  </label>
                  <span className="text-xs text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                    {localTopK}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={localTopK}
                  onChange={(e) => setLocalTopK(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(124, 58, 237) 0%, rgb(124, 58, 237) ${(localTopK / 10) * 100}%, rgba(255,255,255,0.1) ${(localTopK / 10) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <div className="text-center text-[10px] text-primary font-medium">
                  {localTopK > 5 ? 'Broad' : 'Focused'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Conversations List */}
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

        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group ${
            isResizing ? 'bg-primary' : 'bg-transparent'
          }`}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-8 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
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
