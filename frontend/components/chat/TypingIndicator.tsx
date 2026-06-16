'use client';

import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex gap-2 md:gap-4 justify-start">
      {/* Avatar */}
      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 ring-2 ring-primary/20">
        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </div>

      {/* Skeleton Message */}
      <div className="flex flex-col gap-2 max-w-[85%] md:max-w-3xl">
        <div className="rounded-lg px-3 py-2 md:px-4 md:py-3 bg-surface/80 backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          {/* Animated skeleton lines */}
          <div className="space-y-2">
            {[80, 100, 60].map((width, i) => (
              <motion.div
                key={i}
                className="h-4 rounded"
                style={{ width: `${width}%` }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  backgroundColor: [
                    'rgba(255,255,255,0.05)',
                    'rgba(124,58,237,0.1)',
                    'rgba(255,255,255,0.05)'
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
