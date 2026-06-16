'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useChatStore } from '@/store/chatStore';
import { Loader2 } from 'lucide-react';

// Lazy load the ChatInterface component
const ChatInterface = lazy(() => import('@/components/chat/ChatInterface').then(mod => ({ default: mod.ChatInterface })));

export default function ChatPage() {
  const { setCurrentSession, clearMessages } = useChatStore();

  useEffect(() => {
    setCurrentSession(null);
    clearMessages();
  }, [setCurrentSession, clearMessages]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}
