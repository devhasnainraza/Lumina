'use client';

import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils/cn';

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 md:gap-4 justify-start">
      {/* Bot Icon */}
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 ring-2 ring-primary/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-transparent before:to-white/20">
        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-[82%] md:max-w-[70%]">
        {/* Content Bubble */}
        <div className="rounded-2xl px-4.5 py-3 text-base bg-surface/50 backdrop-blur-md border border-white/10 text-text-primary rounded-tl-none shadow-lg relative before:absolute before:inset-0 before:rounded-2xl before:rounded-tl-none before:bg-gradient-to-br before:from-white/[0.02] before:to-transparent before:pointer-events-none">
          <div className="prose prose-invert prose-base max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-[15px] prose-p:text-text-primary prose-strong:font-semibold prose-strong:text-white relative z-10 inline">
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
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          {/* Enhanced Cursor */}
          <motion.span
            className="inline-block w-[2px] h-4 bg-primary rounded-full ml-1.5 align-middle animate-pulse"
            animate={{
              opacity: [1, 0.2, 1],
              scaleY: [1, 0.7, 1]
            }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  );
}
