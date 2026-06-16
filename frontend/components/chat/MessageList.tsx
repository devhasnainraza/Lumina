'use client';

import { useEffect, useRef, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { TypingIndicator } from './TypingIndicator';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { Sparkles, FileText, Search, Lightbulb, MessageCircle, AlertCircle, Database, ShieldCheck, ArrowRight } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { useChatStore } from '@/store/chatStore';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onScroll?: (scrollTop: number) => void;
}

export const MessageList = memo(function MessageList({ messages, streamingMessage, isStreaming, onSuggestionClick, onScroll }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: docData } = useDocuments();
  const { activeModel, temperature } = useChatStore();

  const totalDocuments = docData?.documents?.length || 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, streamingMessage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScroll) return;

    const handleScroll = () => {
      onScroll(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScroll]);

  // Memoize message rendering to prevent unnecessary re-renders
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => (
      <MessageBubble key={message.id || `msg-${index}`} message={message} />
    ));
  }, [messages]);

  const suggestions = [
    { icon: FileText, title: "Summarize my documents", desc: "Get an executive outline of key contents." },
    { icon: Search, title: "Find specific information", desc: "Scan files for facts and answers." },
    { icon: Lightbulb, title: "Extract key insights", desc: "Identify bullet points and core ideas." },
    { icon: MessageCircle, title: "Ask detailed questions", desc: "Engage in deep dialogue on any topic." }
  ];

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto pt-[89px] md:pt-[96px] p-4 md:p-6 pb-28 md:pb-32 space-y-4 md:space-y-6 scroll-smooth min-h-0 relative bg-grid-pattern">
      {messages.length === 0 && !isStreaming && (
        <motion.div
          key="welcome-message-panel"
          className="flex items-center justify-center min-h-full py-8 relative"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glowing Ambient Blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 glow-blob-primary pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 glow-blob-secondary pointer-events-none" />

          <div className="text-center px-4 max-w-4xl relative z-10 w-full">
            {/* Header Sparkle Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-md flex items-center justify-center shadow-[0_8px_32px_rgba(124,58,237,0.15)] relative overflow-hidden"
              animate={{
                boxShadow: [
                  '0 8px 32px rgba(124,58,237,0.15)',
                  '0 8px 40px rgba(124,58,237,0.25)',
                  '0 8px 32px rgba(124,58,237,0.15)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
              <Sparkles className="w-10 h-10 text-primary relative z-10 animate-pulse" />
            </motion.div>

            {/* Main Header Titles */}
            <h2 className="text-fluid-h2 font-extrabold text-text-primary mb-3 bg-gradient-to-r from-white via-white/90 to-text-secondary bg-clip-text text-transparent">
              AI Knowledge Space
            </h2>
            <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Unlock reasoning, structured summaries, and context-aware insights on your custom uploaded knowledge base.
            </p>

            {/* Main Grid: Left RAG Status, Right Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
              
              {/* Left Column: RAG & system status card */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-surface/50 border border-white/10 backdrop-blur-md shadow-lg flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5 mb-3">
                      <Database className="w-3.5 h-3.5 text-primary" />
                      Knowledge Hub
                    </h3>

                    {totalDocuments === 0 ? (
                      <div className="space-y-3">
                        <div className="flex gap-2.5 items-start text-warning/90">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-text-secondary leading-relaxed">
                            No documents found in the database. Upload documents to query your own context files.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2.5 items-start text-success">
                          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-text-primary">
                              Context Index Ready
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {totalDocuments} document{totalDocuments > 1 ? 's' : ''} currently active in your vector storage.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {totalDocuments === 0 ? (
                      <Link
                        href="/documents"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full justify-center group"
                      >
                        <span>Upload Documents</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted/80 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div>
                          <span className="block text-text-muted">Model Selection</span>
                          <span className="font-semibold text-text-primary text-xs block mt-0.5 truncate">
                            {activeModel === 'gemini-1.5-pro' ? 'Gemini 1.5 Pro' : 'Llama 3.3'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-text-muted">Creativity</span>
                          <span className="font-semibold text-text-primary text-xs block mt-0.5">
                            {temperature.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Suggestion cards */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((item, i) => (
                  <motion.button
                    key={i}
                    className="flex flex-col gap-2 p-4 rounded-2xl bg-surface/40 backdrop-blur-md border border-white/5 hover:bg-surface-secondary/40 hover:border-primary/30 transition-all duration-200 text-left group shadow-md hover:shadow-lg hover:shadow-primary/5 cursor-pointer relative"
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSuggestionClick?.(item.title)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

            </div>

          </div>
        </motion.div>
      )}

      {renderedMessages}

      {isStreaming && streamingMessage && (
        <StreamingMessage key="streaming-message-bubble" content={streamingMessage} />
      )}

      {isStreaming && !streamingMessage && <TypingIndicator key="typing-indicator-bubble" />}

      <div key="scroll-anchor" ref={messagesEndRef} />

      {/* Floating Scroll to Bottom Button */}
      <ScrollToBottomButton containerRef={containerRef} />
    </div>
  );
});
