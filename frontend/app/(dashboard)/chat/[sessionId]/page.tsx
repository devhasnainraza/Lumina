'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useChatHistory } from '@/lib/hooks/useChat';
import { Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

// Lazy load the heavy ChatInterface component
const ChatInterface = lazy(() => import('@/components/chat/ChatInterface').then(mod => ({ default: mod.ChatInterface })));

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { setCurrentSession, messages, setMessages } = useChatStore();
  const { data: historyData, isLoading } = useChatHistory(sessionId);

  useEffect(() => {
    if (sessionId) {
      setCurrentSession(sessionId);
    }
  }, [sessionId, setCurrentSession]);

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages);
    }
  }, [historyData, setMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}
