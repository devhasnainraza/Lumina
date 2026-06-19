"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Cpu, Terminal, FileText, Database, MessageSquare, Check } from "lucide-react";
import Link from "next/link";

const suffixes = [
  "Intelligent Answers",
  "Instant Citations",
  "Semantic Search",
  "Actionable Insights"
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % suffixes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-40 pb-28 bg-grid-pattern">
      {/* Dynamic Background Glowing Beams */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-[1000px] max-w-full rounded-full bg-gradient-to-b from-primary/20 via-secondary/10 to-transparent blur-[120px] opacity-75 animate-[pulse_10s_infinite_alternate]" />
      <div className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-[80px] opacity-50 animate-pulse" />
      <div className="absolute top-40 right-1/4 -z-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-[90px] opacity-50 animate-pulse" style={{ animationDelay: "3s" }} />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          
          {/* Pulsing Announcement Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10 px-4.5 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-xl shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all cursor-default"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span className="tracking-wide">Lumina is now 100% free for everyone! 🎉</span>
          </motion.div>

          {/* Premium Fluid Typography Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-8 font-extrabold tracking-tight text-white text-fluid-h1 flex flex-col items-center leading-[1.1]"
          >
            <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              Your Documents,
            </span>
            <span className="relative block h-[1.45em] w-full overflow-hidden mt-1.5 sm:mt-2.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ y: 40, opacity: 0, filter: "blur(5px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -40, opacity: 0, filter: "blur(5px)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-secondary bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] font-extrabold"
                >
                  {suffixes[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto max-w-3xl mb-12 text-base sm:text-lg lg:text-xl leading-relaxed text-text-secondary font-sans"
          >
            Transform raw files into a dynamic cognitive database. Index PDFs, markdown, 
            and spreadsheets, then query your knowledge base with semantic search and exact page-level citations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0 max-w-md mx-auto sm:max-w-none"
          >
            <Link
              href="/signup"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500/95 px-8 py-4.5 text-base font-semibold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Get Started — Free Forever
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-4.5 text-base font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              Explore Dashboard
            </Link>
          </motion.div>

          {/* Gorgeous UI Mockup Component */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 relative rounded-2xl border border-white/10 bg-surface/20 p-2 backdrop-blur-xl shadow-2xl overflow-hidden max-w-4xl mx-auto group"
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-cyan-500/10 pointer-events-none" />

            {/* Browser top-bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex items-center gap-1 bg-white/5 px-4 py-1 rounded-md text-[10px] text-text-muted font-mono w-48 mx-auto truncate">
                <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>lumina.ai/chat/rag-workspace</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard Mockup Grid Layout */}
            <div className="grid grid-cols-12 gap-3 p-4 bg-[#0a0d17]/90 min-h-[320px] text-left text-sm rounded-b-xl relative font-sans">
              
              {/* Sidebar Panel */}
              <div className="col-span-3 hidden md:flex flex-col gap-2.5 border-r border-white/5 pr-3">
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <Database className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-white tracking-wider">Vector Space</span>
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2 text-white text-xs font-semibold">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>RAG Document Q&A</span>
                  </div>
                  <div className="p-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-text-secondary text-xs">
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    <span>Upload blueprints.pdf</span>
                  </div>
                </div>
              </div>

              {/* Central Chat Panel */}
              <div className="col-span-12 md:col-span-9 flex flex-col justify-between min-h-[280px]">
                
                {/* Simulated message bubbles */}
                <div className="space-y-3.5 flex-1 overflow-hidden pr-2">
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-primary to-indigo-600 text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-none max-w-sm shadow-md">
                      Summarize the primary terms of our user licensing agreement.
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/10 text-text-secondary text-xs px-3.5 py-2.5 rounded-2xl rounded-tl-none max-w-md space-y-2">
                      <p>Here are the key licensing guidelines outlined in your document:</p>
                      <ul className="space-y-1.5 pl-3 list-disc text-[11px] text-text-secondary/90">
                        <li>You retain complete ownership of all raw data uploaded.</li>
                        <li>Embeddings are strictly encrypted in an isolated pgvector database.</li>
                      </ul>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-[9px] font-bold text-primary border border-primary/30 uppercase">
                          Source 1 • Page 4
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-[9px] font-bold text-primary border border-primary/30 uppercase">
                          Source 2 • Page 7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated chat input */}
                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-text-muted flex items-center justify-between">
                    <span>Ask about your uploaded documents...</span>
                    <Terminal className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Micro Stats Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-white/5 pt-10 text-left px-6 sm:px-0"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">240ms</p>
                <p className="text-xs text-text-muted">Response Latency</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">99.2%</p>
                <p className="text-xs text-text-muted">Citation Accuracy</p>
              </div>
            </div>
            <div className="hidden md:flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">10M+</p>
                <p className="text-xs text-text-muted">Vectors Embedded</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
