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

const getFollowUps = (content: string): string[] => {
  if (!content) return [];
  
  const contentLower = content.toLowerCase();
  const followups: string[] = [];

  // 1. Certificate / Education / Training Completion
  if (
    contentLower.includes('completed') || 
    contentLower.includes('certificate') || 
    contentLower.includes('certification') || 
    contentLower.includes('course') || 
    contentLower.includes('program') || 
    contentLower.includes('training') || 
    contentLower.includes('exam') ||
    contentLower.includes('skills')
  ) {
    followups.push('What specific skills or topics were covered?');
    followups.push('When does this certificate expire?');
    followups.push('Is there any score or grade mentioned in the document?');
  }
  // 2. Finance / Numbers / Business Reports
  else if (
    contentLower.includes('revenue') || 
    contentLower.includes('finance') || 
    contentLower.includes('sales') || 
    contentLower.includes('profit') || 
    contentLower.includes('budget') || 
    contentLower.includes('cost') || 
    contentLower.includes('expenses') || 
    contentLower.includes('$') || 
    contentLower.includes('usd') ||
    contentLower.includes('margins')
  ) {
    followups.push('Can you summarize the financial highlights?');
    followups.push('What are the main drivers of these figures?');
    followups.push('Are there any expense breakdowns mentioned?');
  }
  // 3. Technical / Code / Architecture
  else if (
    contentLower.includes('code') || 
    contentLower.includes('programming') || 
    contentLower.includes('function') || 
    contentLower.includes('database') || 
    contentLower.includes('api') || 
    contentLower.includes('bug') || 
    contentLower.includes('error') || 
    contentLower.includes('server') ||
    contentLower.includes('deployment')
  ) {
    followups.push('Can you explain how this system or code works?');
    followups.push('What are the potential edge cases?');
    followups.push('How can I optimize this implementation?');
  }
  // 4. Timelines / Milestones (Strictly project planning triggers)
  else if (
    contentLower.includes('milestone') || 
    contentLower.includes('schedule') || 
    contentLower.includes('deadline') || 
    contentLower.includes('timeline') || 
    contentLower.includes('project plan') || 
    contentLower.includes('deliverable')
  ) {
    followups.push('What are the key milestones in this timeline?');
    followups.push('Are there any potential delays noted?');
    followups.push('Who is responsible for the main deliverables?');
  }
  // 5. Default General
  else {
    followups.push('Can you summarize the key points here?');
    followups.push('What specific section of the document does this come from?');
    followups.push('What other key insights are mentioned in this file?');
  }

  return followups.slice(0, 3);
};

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

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div
      ref={containerRef}
      className={`flex-1 p-3 md:p-6 scroll-smooth min-h-0 relative bg-grid-pattern transition-all duration-300 ${
        isEmpty
          ? 'overflow-hidden pt-[72px] md:pt-[80px] pb-[80px] md:pb-[96px] flex flex-col justify-center'
          : 'overflow-y-auto pt-[80px] md:pt-[96px] pb-24 md:pb-32 space-y-4 md:space-y-6'
      }`}
    >
      {isEmpty && (
        <motion.div
          key="welcome-message-panel"
          className="w-full relative py-1 md:py-2"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glowing Ambient Blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 glow-blob-primary pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 glow-blob-secondary pointer-events-none" />
 
          <div className="text-center px-2 md:px-4 max-w-4xl mx-auto relative z-10 w-full">
            {/* Header Sparkle Icon */}
            <motion.div
              className="w-12 h-12 md:w-16 h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 backdrop-blur-md flex items-center justify-center shadow-[0_8px_32px_rgba(124,58,237,0.15)] relative overflow-hidden"
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
              <Sparkles className="w-5 h-5 md:w-8 h-8 text-primary relative z-10 animate-pulse" />
            </motion.div>
 
            {/* Main Header Titles */}
            <h2 className="text-xl md:text-3xl font-extrabold text-text-primary mb-1.5 md:mb-2 bg-gradient-to-r from-white via-white/90 to-text-secondary bg-clip-text text-transparent">
              AI Knowledge Space
            </h2>
            <p className="text-xs md:text-sm text-text-muted max-w-xl mx-auto mb-3 md:mb-5 leading-relaxed">
              Unlock reasoning, summaries, and context-aware insights on your custom uploaded knowledge base.
            </p>
 
            {/* Main Grid: Left RAG Status, Right Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-5 text-left">
              
              {/* Left Column: RAG & system status card */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <div className="p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-surface/50 border border-white/10 backdrop-blur-md shadow-lg flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5 mb-2.5">
                      <Database className="w-3.5 h-3.5 text-primary" />
                      Knowledge Hub
                    </h3>
 
                    {totalDocuments === 0 ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 items-start text-warning/90">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed">
                            No documents found. Upload documents to query your own context files.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2 items-start text-success">
                          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] md:text-xs font-semibold text-text-primary">
                              Context Index Ready
                            </p>
                            <p className="text-[10px] md:text-xs text-text-muted mt-0.5">
                              {totalDocuments} active document{totalDocuments > 1 ? 's' : ''}.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
 
                  <div className="mt-4 md:mt-5">
                    {totalDocuments === 0 ? (
                      <Link
                        href="/documents"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-md shadow-primary/20 hover:shadow-lg transition-all w-full justify-center group"
                      >
                        <span>Upload Documents</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-text-muted/80 bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <div>
                          <span className="block text-text-muted">Model</span>
                          <span className="font-semibold text-text-primary text-[11px] block mt-0.5 truncate">
                            {activeModel === 'gemini-1.5-pro' ? 'Gemini 1.5 Pro' : 'Llama 3.3'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-text-muted">Creativity</span>
                          <span className="font-semibold text-text-primary text-[11px] block mt-0.5">
                            {temperature.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
 
              {/* Right Column: Suggestion cards (2 columns on mobile, descriptions hidden on mobile) */}
              <div className="md:col-span-7 grid grid-cols-2 gap-2.5">
                {suggestions.map((item, i) => (
                  <motion.button
                    key={i}
                    className="flex flex-col gap-1 md:gap-1.5 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl bg-surface/40 backdrop-blur-md border border-white/5 hover:bg-surface-secondary/40 hover:border-primary/30 transition-all duration-200 text-left group shadow-md hover:shadow-lg hover:shadow-primary/5 cursor-pointer relative justify-between min-h-[75px] md:min-h-0"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSuggestionClick?.(item.title)}
                  >
                    <div className="w-6 h-6 md:w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-3 h-3 md:w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-[11px] md:text-xs font-semibold text-text-primary group-hover:text-primary transition-colors leading-tight">
                        {item.title}
                      </h4>
                      <p className="hidden md:block text-[9px] md:text-[11px] text-text-muted mt-0.5 leading-normal">
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
 
      {!isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
        <div className="flex flex-col gap-2 max-w-[82%] md:max-w-[70%] ml-11 md:ml-13 mt-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Suggested Follow-ups
          </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {getFollowUps(messages[messages.length - 1].content).map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="px-3.5 py-2 rounded-xl bg-surface-secondary/40 border border-white/5 hover:border-primary/40 hover:bg-surface-secondary text-xs text-text-secondary hover:text-white transition-all cursor-pointer shadow-md select-none text-left"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
 
      <div key="scroll-anchor" ref={messagesEndRef} />
 
      {/* Floating Scroll to Bottom Button */}
      <ScrollToBottomButton containerRef={containerRef} />
    </div>
  );
});
