'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/store/chatStore';
import { useChatSessions, useClearSessionMessages, useDeleteSession, useCreateSession } from '@/lib/hooks/useChat';
import { Cpu, Trash2, Database, ChevronDown, Thermometer, LogOut, Clock, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatSession } from '@/types/chat';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { usePreviewStore } from '@/store/previewStore';
import { DocumentPreviewPanel } from '@/components/upload/DocumentPreviewPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { SessionListItem } from './SessionListItem';

export function ChatInterface() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { isOpen: isPreviewOpen, closePreview } = usePreviewStore();
  const [previewWidth, setPreviewWidth] = useState(500);
  const [isMobile, setIsMobile] = useState(false);
  const isResizing = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth * 0.75) {
      setPreviewWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  const {
    messages,
    streamingMessage,
    isStreaming,
    currentSessionId,
    activeModel,
    clearMessages,
    setActiveModel,
    temperature,
    setTemperature,
    topK,
    setTopK,
    setCurrentSession,
  } = useChatStore();

  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
  const deleteMutation = useDeleteSession();
  const createSessionMutation = useCreateSession();

  const currentSession = sessionsData?.sessions?.find((s: ChatSession) => s.id === currentSessionId);
  const sessionTitle = currentSession?.title || 'New Conversation';

  const [showHeader, setShowHeader] = useState(true);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const lastScrollTop = useRef(0);

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('pref-user-avatar');
      setAvatarUrl(savedAvatar);
    }
  }, []);

  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localTopK, setLocalTopK] = useState(topK);
  const debouncedTemperature = useDebounce(localTemperature, 300);
  const debouncedTopK = useDebounce(localTopK, 300);

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

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = (scrollTop: number) => {
    // If scrolling down and scrolled more than 50px, hide header
    // If scrolling up, show header
    if (scrollTop > lastScrollTop.current && scrollTop > 50) {
      setShowHeader(false);
      setShowSettings(false); // also hide popover on scroll for better UX
      setShowProfile(false); // also hide profile popover on scroll
    } else {
      if (showHeader === false) {
        setShowHeader(true);
      }
    }
    lastScrollTop.current = scrollTop;
  };

  const getModelLabel = (model: string) => {
    if (model === 'gemini-1.5-pro') return 'Gemini 1.5 Pro';
    if (model === 'llama-3.3-70b-versatile') return 'Llama 3.3 70B';
    return model;
  };

  const getTempDescription = (temp: number) => {
    if (temp <= 0.2) return 'Precise';
    if (temp <= 0.6) return 'Balanced';
    return 'Creative';
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const clearSessionMutation = useClearSessionMessages();

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
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate(sessionId, {
        onSuccess: () => {
          if (sessionId === currentSessionId) {
            handleNewChat();
          }
        }
      });
    }
  };

  const handleClearScreen = async () => {
    if (currentSessionId) {
      try {
        await clearSessionMutation.mutateAsync(currentSessionId);
        clearMessages();
      } catch (err) {
        console.error('Failed to clear session messages on backend', err);
      }
    } else {
      clearMessages();
    }
  };

  return (
    <div className="flex h-full w-full bg-background relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
      
      {/* Sticky Header with Glassmorphism (Scroll to Hide) */}
      <header className={`glass-navbar absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 min-h-[73px] transition-transform duration-300 ease-in-out gap-2 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mobile Chat History Drawer Trigger */}
          <button
            onClick={() => setShowMobileHistory(true)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-white cursor-pointer shrink-0"
            title="Chat History"
          >
            <Clock className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">
              {sessionTitle}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                <Database className="w-3 h-3 text-primary shrink-0" />
                <span className="hidden sm:inline">Knowledge Base Connected</span>
                <span className="sm:hidden">Connected</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Model Selector with Dropdown Popover */}
          <div className="relative shrink-0" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto px-0 sm:px-3.5 rounded-xl sm:rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-medium cursor-pointer"
              title={`Active Model: ${getModelLabel(activeModel)}`}
            >
              <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="hidden sm:inline">{getModelLabel(activeModel)}</span>
              <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 shrink-0 hidden sm:inline ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {showSettings && (
              <div className="absolute right-[-64px] sm:right-0 mt-2.5 w-[calc(100vw-32px)] min-h-[250px] min-[400px]:w-80 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-30 space-y-3 text-left origin-top-right">
                {/* Model Selection */}
                <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-primary" />
                    Model selection
                  </label>
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => setActiveModel('gemini-1.5-pro')}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                        activeModel === 'gemini-1.5-pro'
                          ? 'bg-primary/15 border-primary/35 text-white shadow-md shadow-primary/5'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="font-bold text-text-primary flex items-center justify-between">
                        <span>Gemini 1.5 Pro</span>
                        {activeModel === 'gemini-1.5-pro' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 font-medium">Recommended • Accurate</div>
                    </button>
                    <button
                      onClick={() => setActiveModel('llama-3.3-70b-versatile')}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                        activeModel === 'llama-3.3-70b-versatile'
                          ? 'bg-primary/15 border-primary/35 text-white shadow-md shadow-primary/5'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="font-bold text-text-primary flex items-center justify-between">
                        <span>Llama 3.3 70B</span>
                        {activeModel === 'llama-3.3-70b-versatile' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5 font-medium">Fast • Conversational</div>
                    </button>
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Thermometer className="w-3 h-3 text-primary" />
                      Creativity
                    </label>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
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
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(124, 58, 237) 0%, rgb(124, 58, 237) ${localTemperature * 100}%, rgba(255, 255, 255, 0.1) ${localTemperature * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                  <div className="text-center text-[10px] text-primary font-bold mt-1 tracking-wider uppercase">
                    {getTempDescription(localTemperature)}
                  </div>
                </div>

                {/* Top K */}
                <div className="space-y-2 bg-white/5 border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-primary" />
                      Context Depth
                    </label>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
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
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary slider-thumb"
                    style={{
                      background: `linear-gradient(to right, rgb(124, 58, 237) 0%, rgb(124, 58, 237) ${(localTopK / 10) * 100}%, rgba(255, 255, 255, 0.1) ${(localTopK / 10) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                    }}
                  />
                  <div className="text-center text-[10px] text-primary font-bold mt-1 tracking-wider uppercase">
                    {localTopK > 5 ? 'Broad Context' : 'Focused Context'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearScreen}
            disabled={clearSessionMutation.isPending}
            className="text-text-muted hover:text-white hover:bg-white/5 font-medium text-xs gap-1.5 rounded-xl w-9 md:w-auto px-0 md:px-3 h-9 border border-white/5 hover:border-white/10 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Clear Chat Screen"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Clear screen</span>
          </Button>

          {/* User Profile Selector with Dropdown Popover */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md shadow-primary/10 shrink-0"
              title="User Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {/* Profile Dropdown Popover */}
            {showProfile && (
              <div className="absolute right-0 mt-2.5 w-64 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-30 space-y-3 text-left">
                <div className="flex items-center gap-3 pb-2.5 border-b border-white/5">
                  <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Message Area - flex-1 allows it to fill available space and scroll */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          onSuggestionClick={(suggestion) => {
            const event = new CustomEvent('suggestion-click', { detail: suggestion });
            window.dispatchEvent(event);
          }}
          onScroll={handleScroll}
        />

        {/* Floating Input Box with Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pointer-events-none">
          <div className="pointer-events-auto">
            <ChatInput />
          </div>
        </div>
      </div>

      </div> {/* End of main chat area flex-col */}

      {/* Slide-out Document Previewer */}
      <AnimatePresence>
        {isPreviewOpen && (
          <>
            {/* Draggable Divider (Desktop Only) */}
            {!isMobile && (
              <div
                onMouseDown={handleMouseDown}
                className="w-1.5 hover:w-2 bg-white/5 hover:bg-primary/40 cursor-col-resize transition-all h-full z-30 select-none flex-shrink-0 relative"
                title="Drag to resize workspace"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white/20 rounded-full group-hover:bg-primary/60" />
              </div>
            )}
            
            {/* Preview Panel Container */}
            <motion.div
              initial={{ x: isMobile ? '100%' : 200, opacity: 0, width: isMobile ? '100%' : 0 }}
              animate={{ x: 0, opacity: 1, width: isMobile ? '100%' : previewWidth }}
              exit={{ x: '100%', opacity: 0, width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                "h-full flex-shrink-0 shadow-2xl z-40 bg-background",
                isMobile ? "absolute inset-y-0 right-0 w-full" : "relative"
              )}
              style={{ width: isMobile ? '100%' : previewWidth }}
            >
              <DocumentPreviewPanel onClose={closePreview} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Chat History Drawer (slide-in from left) */}
      <AnimatePresence>
        {showMobileHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowMobileHistory(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 bg-surface/95 backdrop-blur-xl border-r border-white/10 z-50 md:hidden flex flex-col p-4 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-text-primary uppercase tracking-wide">History</span>
                </div>
                <button
                  onClick={() => setShowMobileHistory(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Actions: New Chat */}
              <Button
                onClick={() => {
                  handleNewChat();
                  setShowMobileHistory(false);
                }}
                disabled={createSessionMutation.isPending}
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/85 shadow-lg shadow-primary/25 mb-4 py-2.5 rounded-xl text-xs font-semibold"
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-2" />
                )}
                New Chat
              </Button>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
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
                      onClick={() => {
                        handleSessionClick(session.id);
                        setShowMobileHistory(false);
                      }}
                      onDelete={(e) => handleDeleteClick(e, session.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-text-muted">
                    No conversations yet
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
