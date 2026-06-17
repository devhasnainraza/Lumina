'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, Database, Cpu, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export function TypingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => setStep(2), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    {
      id: 0,
      label: 'Analyzing Prompt Semantics',
      detail: 'Embedding query using text-embedding-004...',
      icon: Sparkles,
    },
    {
      id: 1,
      label: 'Scanning Vector Space Database',
      detail: 'Retrieving top matching context chunks from ChromaDB...',
      icon: Database,
    },
    {
      id: 2,
      label: 'Synthesizing Answer with Gemini',
      detail: 'Structuring response grounded in selected documents...',
      icon: Cpu,
    },
  ];

  return (
    <div className="flex gap-3 md:gap-4 justify-start my-2">
      {/* Bot Icon */}
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 ring-2 ring-primary/20 relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-t before:from-transparent before:to-white/20">
        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
      </div>

      {/* RAG Progress Container */}
      <div className="flex-1 flex flex-col gap-2 max-w-[85%] md:max-w-xl">
        <div className="rounded-2xl px-5 py-4 bg-surface/50 backdrop-blur-md border border-white/10 shadow-lg flex flex-col gap-3 relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.01] before:to-transparent before:pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
            RAG Pipeline In Progress
          </span>

          <div className="relative flex flex-col gap-4.5 mt-2.5 pl-6">
            {/* Animated Connector Line */}
            <div className="absolute left-[9.5px] top-2.5 bottom-2.5 w-[1.5px] bg-white/5 overflow-hidden">
              <motion.div 
                className="w-full bg-gradient-to-b from-primary via-cyan-400 to-indigo-500 origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: step === 0 ? 0.25 : step === 1 ? 0.65 : 1 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              />
            </div>

            {steps.map((s) => {
              const isCurrent = step === s.id;
              const isPassed = step > s.id;

              return (
                <div key={s.id} className="flex gap-3 items-start relative select-none">
                  {/* Step Bullet */}
                  <div className="absolute left-[-24px] top-0.5 flex items-center justify-center">
                    {isPassed ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-success/20 border border-success/35 flex items-center justify-center"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.12, 1], 
                          boxShadow: [
                            '0 0 0 rgba(124,58,237,0)', 
                            '0 0 8px rgba(124,58,237,0.25)', 
                            '0 0 0 rgba(124,58,237,0)'
                          ] 
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-5 h-5 rounded-full bg-primary/20 border border-primary/45 flex items-center justify-center"
                      >
                        <motion.div 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary" 
                        />
                      </motion.div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-text-muted/30" />
                      </div>
                    )}
                  </div>

                  {/* Step Metadata */}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-[12px] font-bold transition-all duration-300 block leading-tight",
                      isCurrent ? "text-text-primary scale-[1.01]" : isPassed ? "text-text-secondary/70 font-semibold" : "text-text-muted/35"
                    )}>
                      {s.label}
                    </span>
                    {isCurrent && (
                      <motion.span 
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-text-muted mt-1 block leading-normal font-medium"
                      >
                        {s.detail}
                      </motion.span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
