"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Brain,
  MessageSquare,
  FileCheck,
  Zap,
  FileText,
  CheckCircle,
  Database,
  ArrowUpRight
} from "lucide-react";
import { useState, useEffect } from "react";

export function Features() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [activeCitation, setActiveCitation] = useState(false);

  // Auto loop the upload simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setUploadState("uploading");
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadState("done");
            return 100;
          }
          return prev + 10;
        });
      }, 150);

    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 border-t border-white/5 relative overflow-hidden" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-fluid-h2 font-bold tracking-tight text-white mb-4"
          >
            Engineered for Precision Knowledge Retrieval
          </motion.h2>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
            Supercharge your files. Our advanced RAG pipeline indexes, matches, and extracts facts with bulletproof reliability.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          
          {/* Card 1: Document Ingestion (Double Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 70% 70%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)" }} />
            
            <div className="flex flex-col sm:flex-row gap-8 justify-between items-start">
              <div className="max-w-md">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Automated Ingestion Pipeline</h3>
                <p className="text-sm text-text-secondary leading-relaxed font-sans">
                  Drag and drop files. Our parser splits documents, removes formatting noise, extracts metadata, and generates clean embeddings.
                </p>
              </div>

              {/* Ingestion Visualizer Box */}
              <div className="w-full sm:w-64 border border-white/5 bg-surface/50 rounded-2xl p-4 flex flex-col gap-3 shrink-0 shadow-lg shadow-black/10">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-white truncate">Q4_Report.pdf</span>
                </div>
                
                {uploadState === "uploading" && (
                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between text-[10px] text-text-muted">
                      <span>Generating Vectors...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadState === "done" && (
                  <div className="flex items-center justify-between py-1 animate-pulse">
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Indexed Successfully
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                      124 Chunks
                    </span>
                  </div>
                )}

                {uploadState === "idle" && (
                  <div className="flex items-center justify-center h-8 border border-dashed border-white/10 rounded-lg text-[10px] text-text-muted font-sans">
                    Waiting for upload...
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-text-muted font-mono">
                  <div className="bg-white/5 px-2 py-1 rounded">Text Splitter</div>
                  <div className="bg-white/5 px-2 py-1 rounded">Recursive</div>
                  <div className="bg-white/5 px-2 py-1 rounded">Overlap: 50</div>
                  <div className="bg-white/5 px-2 py-1 rounded">Chunks: 1024</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Smart Citations (Single Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)" }} />
            
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
              <FileCheck className="h-5 w-5" />
            </div>

            {/* Citations Preview Box */}
            <div className="my-4 border border-white/5 bg-surface/50 rounded-2xl p-4 flex flex-col gap-2 relative">
              <p className="text-[10px] text-text-secondary leading-relaxed font-sans">
                Our base model answers requests accurately using sources:
              </p>
              <div 
                className="bg-white/5 px-3 py-2 rounded-xl text-[10px] text-white flex items-center justify-between cursor-pointer border border-white/5 hover:border-primary/30 transition-all"
                onMouseEnter={() => setActiveCitation(true)}
                onMouseLeave={() => setActiveCitation(false)}
              >
                <span className="font-mono text-primary font-bold">Source [1]</span>
                <span className="text-[9px] text-text-muted">Remote_Policy.pdf · Page 4</span>
                <ArrowUpRight className="h-3 w-3 text-text-muted" />
              </div>

              {/* Tooltip Hover Overlay */}
              <div className={`absolute -top-12 left-4 right-4 bg-primary rounded-xl p-2.5 text-[9px] text-white shadow-xl shadow-black/30 border border-primary/20 transition-all duration-300 pointer-events-none ${
                activeCitation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}>
                <p className="font-bold mb-0.5">Matched Segment (Cosine Similarity 0.94):</p>
                <p className="italic text-white/80">"...employees are allowed up to 3 remote days per work week."</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Bulletproof Citations</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                Every answer includes click-to-verify sources with page numbers, document names, and chunk matching scores.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Multi-Document Orbit (Single Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)" }} />
            
            <div>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cognitive AI Memory</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                Maintain chat context dynamically. The AI tracks conversational history, indexing relevant nodes as files change.
              </p>
            </div>

            {/* Orbit Circle Visual */}
            <div className="h-28 flex items-center justify-center relative mt-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center animate-pulse">
                <Database className="h-7 w-7 text-white" />
              </div>
              {/* Rotating Dot Path */}
              <div className="absolute h-24 w-24 rounded-full border border-dashed border-white/10 animate-[spin_12s_linear_infinite]">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary shadow-primary-sm" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-secondary shadow-primary-sm" />
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 rounded-full bg-emerald-400 shadow-primary-sm" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Vector Cluster (Double Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 10% 10%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)" }} />
            
            <div className="flex flex-col sm:flex-row gap-8 justify-between items-start">
              {/* Cluster Graphic */}
              <div className="w-full sm:w-64 border border-white/5 bg-surface/50 rounded-2xl p-4 h-40 shrink-0 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-black/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                  <span className="text-[10px] font-mono text-white">Embeddings Space Map</span>
                  <span className="text-[8px] text-text-muted font-mono">2530 Dimensions</span>
                </div>
                {/* Cluster Visualizer Graph */}
                <div className="flex-1 relative mt-2 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 60">
                    {/* Background clusters */}
                    <circle cx="20" cy="15" r="3" fill="#7C3AED" opacity="0.4" />
                    <circle cx="25" cy="22" r="2" fill="#7C3AED" opacity="0.3" />
                    <circle cx="15" cy="25" r="4" fill="#7C3AED" opacity="0.5" />
                    
                    <circle cx="80" cy="45" r="3" fill="#06B6D4" opacity="0.4" />
                    <circle cx="75" cy="38" r="2.5" fill="#06B6D4" opacity="0.5" />
                    <circle cx="85" cy="35" r="4" fill="#06B6D4" opacity="0.3" />

                    {/* Query Match line */}
                    <circle cx="50" cy="30" r="3.5" fill="#E11D48" className="animate-ping" />
                    <circle cx="50" cy="30" r="3.5" fill="#E11D48" />
                    
                    {/* Similarity connectors */}
                    <line x1="50" y1="30" x2="80" y2="45" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="50" y1="30" x2="75" y2="38" stroke="rgba(6, 182, 212, 0.7)" strokeWidth="0.7" />
                    <text x="60" y="27" fill="#06B6D4" fontSize="5" fontFamily="monospace">cos: 0.96</text>
                  </svg>
                </div>
              </div>

              <div className="max-w-md">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Hybrid Semantic Retrieval</h3>
                <p className="text-sm text-text-secondary leading-relaxed font-sans">
                  Combine TF-IDF keyword indexing with dense vector similarity mapping. Locate documents instantly whether the query matches direct strings or implicit meaning.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Streaming Response Speeds (Single Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 90% 10%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)" }} />
            
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Zap className="h-5 w-5" />
            </div>

            {/* Circular Speed Loader Visual */}
            <div className="my-4 flex flex-col items-center">
              <div className="text-4xl font-extrabold text-white tracking-tight mb-1">120+</div>
              <div className="text-[10px] text-primary font-semibold tracking-wider uppercase font-mono">Tokens / Sec</div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-3 max-w-[150px]">
                <div className="bg-primary h-full w-[85%] animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Streaming</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                No latency waiting. Answers stream token-by-token in real time, delivering context as soon as it is matched.
              </p>
            </div>
          </motion.div>

          {/* Card 6: Analytics & Monitoring (Double Width) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 flex flex-col justify-between rounded-3xl p-8 bg-surface/30 border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group min-h-[320px]"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 50% 90%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)" }} />
            
            <div className="flex flex-col sm:flex-row gap-8 justify-between items-start">
              <div className="max-w-md">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Usage Insights</h3>
                <p className="text-sm text-text-secondary leading-relaxed font-sans">
                  Monitor document ingestion stats, accuracy benchmarks, API query volumes, and database status parameters in one integrated dashboard.
                </p>
              </div>

              {/* Vector Chart Visual */}
              <div className="w-full sm:w-64 border border-white/5 bg-surface/50 rounded-2xl p-4 h-40 shrink-0 flex flex-col justify-between shadow-lg shadow-black/10">
                <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
                  <span>Accuracy Score Over Time</span>
                  <span className="text-emerald-400 font-bold">avg 94.2%</span>
                </div>
                {/* SVG Graph path */}
                <div className="flex-1 mt-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 45">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Fill */}
                    <path d="M 0 45 L 0 35 Q 20 20 35 28 T 70 15 T 100 8 L 100 45 Z" fill="url(#chartGlow)" />
                    {/* Line */}
                    <path d="M 0 35 Q 20 20 35 28 T 70 15 T 100 8" fill="none" stroke="#06B6D4" strokeWidth="1.5" className="animate-[dash_3s_ease-out_infinite]" />
                    {/* Dots */}
                    <circle cx="35" cy="28" r="2" fill="#06B6D4" />
                    <circle cx="70" cy="15" r="2" fill="#06B6D4" />
                    <circle cx="100" cy="8" r="2" fill="#06B6D4" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
