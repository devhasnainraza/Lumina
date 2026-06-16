"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Cpu } from "lucide-react";
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
    <section className="relative overflow-hidden pt-36 pb-24 bg-grid-pattern">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-1/4 -z-10 h-96 w-96 rounded-full glow-blob-primary opacity-60 animate-pulse duration-5000" />
      <div className="absolute top-24 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-60 animate-pulse duration-5000" style={{ animationDelay: "2.5s" }} />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Pulsing Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-text-secondary backdrop-blur-md shadow-primary-sm hover:border-primary/45 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="tracking-wide">AI-Powered Vector Search & Retrieval Engine</span>
          </motion.div>

          {/* Fluid Typography Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 font-bold tracking-tight text-white text-fluid-h1 flex flex-col items-center"
          >
            <span>Your Documents,</span>
            <span className="relative block h-[1.4em] w-full overflow-hidden mt-1 sm:mt-2 animate-[pulse_6s_infinite_alternate]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ y: 45, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -45, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute left-0 right-0 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"
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
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl mb-12 text-base sm:text-lg lg:text-xl leading-relaxed text-text-secondary"
          >
            Transform raw files into a dynamic cognitive database. Index PDFs, markdown files, 
            and spreadsheets, then query your knowledge base with semantic search and exact page-level citations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0"
          >
            <Link
              href="/signup"
              className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white transition-all shadow-primary-md hover:shadow-primary-lg hover:bg-primary/95 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-4 text-base font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Explore Dashboard
            </Link>
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
