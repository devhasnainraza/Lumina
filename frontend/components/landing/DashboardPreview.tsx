"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Plus, 
  Search,
  CheckCircle,
  Clock,
  ArrowRight,
  Database,
  Play
} from "lucide-react";

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<"chat" | "docs" | "analytics">("chat");

  return (
    <section className="py-24 border-t border-white/5 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-0 -z-10 h-96 w-96 rounded-full glow-blob-primary opacity-25 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-fluid-h2 font-bold tracking-tight text-white mb-4"
          >
            Management Dashboard
          </motion.h2>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
            Take total control of your knowledge workspace. Manage files, track conversation analytics, and monitor system performance.
          </p>
        </div>

        {/* Dashboard Teaser Frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-surface/50 shadow-2xl max-w-5xl mx-auto shadow-black/40 backdrop-blur-md"
        >
          {/* Top Titlebar */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-surface-secondary/40 px-6 py-4">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-text-muted font-mono ml-4">admin.aiknowledge.io/workspace</span>
          </div>

          <div className="flex flex-col md:flex-row min-h-[480px]">
            
            {/* Sidebar (left/top) */}
            <div className="w-full md:w-64 border-r border-white/5 bg-surface-secondary/20 p-6 shrink-0 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-primary-sm">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-white text-sm">Workspace API</span>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: "chat", icon: MessageSquare, label: "Conversations" },
                    { id: "docs", icon: FileText, label: "Documents" },
                    { id: "analytics", icon: BarChart3, label: "Analytics" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all cursor-pointer ${
                        activeTab === item.id
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-text-secondary border border-transparent hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Sidebar bottom indicator */}
              <div className="border-t border-white/5 pt-4 text-[10px] text-text-muted font-mono">
                <p>Status: Healthy</p>
                <p>Embedder: ada-002</p>
              </div>
            </div>

            {/* Content Body (right/bottom) */}
            <div className="flex-1 p-8 bg-surface/20 flex flex-col justify-between min-h-[420px]">
              
              <AnimatePresence mode="wait">
                {activeTab === "chat" && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Conversations Tracker</h3>
                      <p className="text-xs text-text-muted">Active threads and citation response accuracy logs.</p>
                    </div>

                    {/* Stats mini cards */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <span className="text-[10px] text-text-muted font-mono block mb-1">TOTAL CHATS</span>
                        <span className="text-xl font-bold text-white">1,247</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <span className="text-[10px] text-text-muted font-mono block mb-1">AVG SATISFACTION</span>
                        <span className="text-xl font-bold text-primary">98.4%</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-text-muted font-mono block mb-1">SESSION SPEED</span>
                        <span className="text-xl font-bold text-secondary">240ms</span>
                      </div>
                    </div>

                    {/* Chats List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Live Session Logs</h4>
                      {[
                        { title: "Authentication issues with Docker deploy", time: "2 min ago", status: "Active", messages: 3 },
                        { title: "Querying PDF Q4 revenue details", time: "10 min ago", status: "Completed", messages: 12 },
                        { title: "Hybrid workspace vacation count", time: "1h ago", status: "Completed", messages: 5 },
                      ].map((chat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-xs">
                          <div className="flex items-center gap-3">
                            <span className={`h-2 w-2 rounded-full ${chat.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-text-muted"}`} />
                            <span className="text-white font-medium truncate max-w-[180px] sm:max-w-[300px]">{chat.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-text-muted shrink-0 font-mono text-[10px]">
                            <span>{chat.messages} msgs</span>
                            <span>{chat.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "docs" && (
                  <motion.div
                    key="docs"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Indexed Knowledge</h3>
                        <p className="text-xs text-text-muted font-sans">Active document vectors and index statuses.</p>
                      </div>
                      <button className="flex items-center gap-1 bg-primary px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-primary/95 transition-colors cursor-pointer">
                        <Plus className="h-3.5 w-3.5" /> Add Document
                      </button>
                    </div>

                    {/* Document Storage Table */}
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5">
                      <div className="grid grid-cols-12 text-[10px] text-text-muted font-mono uppercase bg-white/5 p-3.5 border-b border-white/5">
                        <span className="col-span-6">Filename</span>
                        <span className="col-span-2 text-center">Size</span>
                        <span className="col-span-4 text-right">Status</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {[
                          { name: "Company_Handbook.pdf", size: "1.2 MB", status: "Ready", chunks: 124 },
                          { name: "Q4_Financial_Report.xlsx", size: "820 KB", status: "Ready", chunks: 54 },
                          { name: "Developer_API_Guide.md", size: "95 KB", status: "Ready", chunks: 32 },
                          { name: "Marketing_Plan_2025.docx", size: "2.1 MB", status: "Parsing (85%)", chunks: 0 },
                        ].map((doc, idx) => (
                          <div key={idx} className="grid grid-cols-12 text-xs p-3.5 items-center font-sans">
                            <div className="col-span-6 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-white font-medium truncate">{doc.name}</span>
                            </div>
                            <span className="col-span-2 text-center text-text-muted font-mono text-[10px]">{doc.size}</span>
                            <div className="col-span-4 text-right">
                              {doc.status === "Ready" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                                  <CheckCircle className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                  <Clock className="h-3 w-3 animate-spin" /> Ingesting
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Performance Benchmarks</h3>
                      <p className="text-xs text-text-muted">Dynamic indexing rates and similarity margins.</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <span className="text-[10px] text-text-muted font-mono block mb-1">RETRIEVAL ACCURACY</span>
                        <span className="text-xl font-bold text-white flex items-center gap-1">
                          94.2% <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <span className="text-[10px] text-text-muted font-mono block mb-1">INDEXING THROUGHPUT</span>
                        <span className="text-xl font-bold text-white">45 docs/min</span>
                      </div>
                    </div>

                    {/* Performance SVG Chart */}
                    <div className="border border-white/5 bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[10px] text-text-muted font-mono uppercase">System Load (Query rate/sec)</span>
                        <span className="text-[9px] text-text-muted font-mono">Real-time updates</span>
                      </div>
                      <div className="h-28">
                        <svg className="w-full h-full" viewBox="0 0 100 40">
                          <defs>
                            <linearGradient id="primaryGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M 0 40 L 0 32 Q 25 10 40 28 T 80 18 T 100 8 L 100 40 Z" fill="url(#primaryGlow)" />
                          <path d="M 0 32 Q 25 10 40 28 T 80 18 T 100 8" fill="none" stroke="#7C3AED" strokeWidth="1.5" />
                          <circle cx="40" cy="28" r="1.5" fill="#7C3AED" />
                          <circle cx="80" cy="18" r="1.5" fill="#7C3AED" />
                          <circle cx="100" cy="8" r="1.5" fill="#7C3AED" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom CTA */}
              <div className="border-t border-white/5 mt-6 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-text-muted font-mono">AI Knowledge Platform v2.0</span>
                <button className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-white transition-colors cursor-pointer">
                  Go to full application <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
