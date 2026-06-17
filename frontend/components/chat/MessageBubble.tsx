'use client';

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { SourceCitation } from './SourceCitation';
import { CodeBlock } from './CodeBlock';
import type { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils/cn';
import { User, Bot, Copy, Check } from 'lucide-react';
import { usePreviewStore } from '@/store/previewStore';

interface MessageBubbleProps {
  message: ChatMessage;
}

// Live timestamp component that updates every minute
function LiveTimestamp({ timestamp }: { timestamp: string }) {
  const [displayTime, setDisplayTime] = useState('');

  const formatTimestamp = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString.includes('Z') || dateString.includes('+') ? dateString : dateString + 'Z');
    const now = new Date();

    if (isNaN(date.getTime())) {
      return '';
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    if (diffInHours < 24) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    if (diffInDays === 1) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Yesterday at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    if (diffInDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]} at ${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()} at ${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  useEffect(() => {
    setDisplayTime(formatTimestamp(timestamp));
    const interval = setInterval(() => {
      setDisplayTime(formatTimestamp(timestamp));
    }, 30000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className="text-xs text-text-muted/70">{displayTime}</span>;
}

// Helper to determine if a specific source index (0-based) is cited in the message text (e.g. "Source 1")
const isSourceCited = (content: string, sourceIndex: number): boolean => {
  if (!content) return false;
  const citationNumber = sourceIndex + 1;
  const regex = new RegExp(`Source\\s*${citationNumber}\\b`, 'i');
  return regex.test(content);
};

// Helper to transform [Source X] into markdown link [Source X](#source-x)
const formatContentCitations = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[Source\s*(\d+)\]/gi, (match, num) => `[Source ${num}](#source-${num})`);
};

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const openPreview = usePreviewStore((state) => state.openPreview);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex gap-3 md:gap-4 group relative', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 ring-2 ring-primary/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-transparent before:to-white/20">
          <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={cn('flex flex-col gap-1.5 max-w-[82%] md:max-w-[70%]', isUser && 'items-end')}>
        
        {/* Content Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4.5 py-3 text-base transition-all duration-300 relative group/bubble',
            isUser
              ? 'bg-gradient-to-br from-primary via-indigo-600 to-primary/80 text-white rounded-tr-none shadow-[0_4px_16px_rgba(124,58,237,0.2)] border border-primary/20'
              : 'bg-surface/50 backdrop-blur-md border border-white/10 text-text-primary rounded-tl-none shadow-lg relative before:absolute before:inset-0 before:rounded-2xl before:rounded-tl-none before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none'
          )}
        >
          {/* Message Actions (Copy) - visible on hover */}
          <div className={cn(
            'absolute top-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex gap-1',
            isUser ? 'left-[-40px] md:left-[-48px]' : 'right-[-40px] md:right-[-48px]'
          )}>
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-lg bg-surface-secondary/80 border border-white/10 hover:bg-surface-secondary hover:border-primary/40 flex items-center justify-center text-text-secondary hover:text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
              title="Copy message"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-base max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-[15px] prose-p:text-text-primary prose-strong:font-semibold prose-strong:text-white relative z-10">
              <ReactMarkdown
                components={{
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const isBlock = match || codeString.includes('\n');

                    if (isBlock) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : 'text'}
                          value={codeString}
                        />
                      );
                    }

                    return (
                      <code className={cn('bg-black/40 px-1.5 py-0.5 rounded text-primary text-xs font-mono border border-white/5', className)} {...rest}>
                        {children}
                      </code>
                    );
                  },
                  strong({ children }) {
                    return (
                      <strong className="text-secondary font-extrabold bg-secondary/10 px-1.5 py-0.5 rounded-lg text-[12px] inline-flex items-center border border-secondary/15 shadow-sm my-0.5 uppercase tracking-wide">
                        {children}
                      </strong>
                    );
                  },
                  li({ children }) {
                    return (
                      <li className="flex items-start gap-2.5 my-2.5 list-none text-text-secondary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="text-[14px] leading-relaxed flex-1 text-text-secondary/95">{children}</div>
                      </li>
                    );
                  },
                  ul({ children }) {
                    return <ul className="pl-0 my-3 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="pl-0 my-3 space-y-1 list-decimal list-inside">{children}</ol>;
                  },
                  p({ children }) {
                    return <p className="my-3 leading-relaxed text-[15px] text-text-primary/95 whitespace-pre-wrap">{children}</p>;
                  },
                  a({ href, children }) {
                    if (href && href.startsWith('#source-')) {
                      const numStr = href.replace('#source-', '');
                      const sourceIndex = parseInt(numStr) - 1;
                      const source = message.sources?.[sourceIndex];

                      const handleSourceClick = () => {
                        if (source && source.documentId) {
                          openPreview(source.documentId, source.documentName, source.chunkIndex);
                        }
                      };

                      return (
                        <span 
                          onClick={handleSourceClick}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase cursor-pointer hover:bg-primary/30 transition-all select-none shadow-sm shadow-primary/5"
                        >
                          {children}
                        </span>
                      );
                    }
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline inline-flex items-center gap-0.5 font-bold">
                        {children}
                      </a>
                    );
                  }
                }}
              >
                {formatContentCitations(message.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citations & Metadata */}
        {!isUser && message.sources && message.sources.length > 0 && message.sources.some(s => s.documentName && s.documentName !== 'Unknown Document') && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.sources
              .filter((s, index) => s.documentName && s.documentName !== 'Unknown Document' && isSourceCited(message.content, index))
              .map((source, index) => (
                <SourceCitation
                  key={`${source.documentId}-${source.chunkIndex}-${index}`}
                  source={source}
                />
              ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-0.5">
          <LiveTimestamp timestamp={message.createdAt} />
        </div>
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-secondary via-cyan-500 to-secondary/80 flex items-center justify-center flex-shrink-0 shadow-lg shadow-secondary/20 ring-2 ring-secondary/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-transparent before:to-white/20">
          <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
      )}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id &&
         prevProps.message.content === nextProps.message.content;
});

