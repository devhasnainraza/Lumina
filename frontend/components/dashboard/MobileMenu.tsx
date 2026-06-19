'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageSquare, FileText, BarChart3, Settings, LogOut, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils/cn';
import { createPortal } from 'react-dom';
import { useChatStore } from '@/store/chatStore';
import { useChatSessions, useDeleteSession, useCreateSession } from '@/lib/hooks/useChat';
import { SessionListItem } from '@/components/chat/SessionListItem';

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentSessionId, setCurrentSession, clearMessages } = useChatStore();
  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
  const createSessionMutation = useCreateSession();
  const deleteMutation = useDeleteSession();

  const isChatPage = pathname?.startsWith('/chat');

  // Mark component as mounted for Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync avatar from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('pref-user-avatar');
      setAvatarUrl(savedAvatar);
    }
  }, [isOpen]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  const handleNewChat = () => {
    if (createSessionMutation.isPending) return;
    createSessionMutation.mutate(undefined, {
      onSuccess: (session) => {
        setCurrentSession(session.id);
        clearMessages();
        setIsOpen(false);
        router.push(`/chat/${session.id}`);
      },
      onError: (err) => {
        console.error('Failed to create new session', err);
        setCurrentSession(null);
        clearMessages();
        setIsOpen(false);
        router.push('/chat');
      }
    });
  };

  const handleSessionClick = (sessionId: string) => {
    setCurrentSession(sessionId);
    setIsOpen(false);
    router.push(`/chat/${sessionId}`);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteMutation.mutate(sessionId, {
        onSuccess: () => {
          if (sessionId === currentSessionId) {
            handleNewChat();
          }
        },
      });
    }
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999]"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <motion.div
            ref={menuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-y-0 right-0 w-72 max-w-[85vw] border-l border-white/10 z-[10000] flex flex-col p-5 shadow-2xl"
            style={{ backgroundColor: '#0b0d19' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                  <img src="/lumina_logo.png" alt="Lumina Logo" className="h-full w-auto object-contain" />
                </div>
                <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Lumina</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white cursor-pointer transition-colors"
                title="Close Menu"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-2xl mb-4 shadow-md shrink-0">
              <div className="w-11 h-11 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-primary truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Navigation & Conversations Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 my-2">
              {/* Navigation Links */}
              <nav className="space-y-2.5">
                {navigation.map((item) => {
                  const isActive = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3.5 px-4 py-3 rounded-xl border transition-all duration-200 relative overflow-hidden group shadow-sm',
                        isActive
                          ? 'bg-gradient-to-r from-primary/25 to-primary/10 border-primary/40 text-white font-bold'
                          : 'bg-white/[0.03] border-white/5 text-text-secondary hover:bg-white/[0.08] hover:border-white/10 hover:text-text-primary'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-primary" />
                      )}
                      <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary")} />
                      <span className="font-semibold text-xs tracking-wide">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Chat Sessions (only on chat page) */}
              {isChatPage && (
                <div className="border-t border-white/10 pt-4">
                  {/* Conversations Header */}
                  <div className="px-2 pb-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Conversations
                    </span>
                    <button
                      onClick={handleNewChat}
                      disabled={createSessionMutation.isPending}
                      className="p-1 rounded-lg hover:bg-white/5 transition-all text-text-secondary hover:text-primary cursor-pointer disabled:opacity-50"
                      title="New Chat"
                    >
                      {createSessionMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Conversations List */}
                  <div className="space-y-1">
                    {sessionsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                      </div>
                    ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
                      sessionsData.sessions.map((session: any) => (
                        <SessionListItem
                          key={session.id}
                          session={session}
                          isActive={session.id === currentSessionId}
                          onClick={() => handleSessionClick(session.id)}
                          onDelete={(e) => handleDeleteSession(e, session.id)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-6 px-3 bg-white/[0.01] border border-white/5 rounded-xl">
                        <p className="text-[10px] text-text-muted">No conversations yet</p>
                        <button
                          onClick={handleNewChat}
                          disabled={createSessionMutation.isPending}
                          className="mt-2 text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Start a chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer / Logout */}
            <div className="pt-4 border-t border-white/10 mt-auto shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="block md:hidden">
      {/* Hamburger Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center bg-surface-secondary shadow-md hover:scale-105 active:scale-95 transition-all text-text-primary cursor-pointer shrink-0"
        title="Open Navigation"
      >
        <Menu className="w-5 h-5 text-text-secondary hover:text-white transition-colors" />
      </button>

      {/* Slide-out Menu Drawer via Portal */}
      {mounted && typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null}
    </div>
  );
}
