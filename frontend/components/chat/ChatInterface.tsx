'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore } from '@/store/chatStore';
import { useChatSessions, useClearSessionMessages } from '@/lib/hooks/useChat';
import { Cpu, Trash2, Database, ChevronDown, Thermometer, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatSession } from '@/types/chat';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function ChatInterface() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
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
  } = useChatStore();

  const { data: sessionsData } = useChatSessions();
  const currentSession = sessionsData?.sessions?.find((s: ChatSession) => s.id === currentSessionId);
  const sessionTitle = currentSession?.title || 'New Conversation';

  const [showHeader, setShowHeader] = useState(true);
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
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Sticky Header with Glassmorphism (Scroll to Hide) */}
      <header className={`glass-navbar absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3.5 pl-16 md:pl-6 min-h-[73px] transition-transform duration-300 ease-in-out ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-base font-bold text-text-primary truncate max-w-[200px] sm:max-w-[400px]">
              {sessionTitle}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                <Database className="w-3 h-3 text-primary" />
                Knowledge Base Connected
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2">
          {/* Active Model Selector with Dropdown Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-medium cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>{getModelLabel(activeModel)}</span>
              <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {showSettings && (
              <div className="absolute right-0 mt-2.5 w-80 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-30 space-y-3 text-left">
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
            className="text-text-muted hover:text-white hover:bg-white/5 font-medium text-xs gap-1.5 rounded-xl px-3 h-9 border border-white/5 hover:border-white/10 transition-all cursor-pointer disabled:opacity-50"
            title="Clear Chat Screen"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear screen</span>
          </Button>

          {/* User Profile Selector with Dropdown Popover */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md shadow-primary/10"
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
    </div>
  );
}
