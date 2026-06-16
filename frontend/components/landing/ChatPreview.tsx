"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  HelpCircle, 
  Cpu, 
  Database, 
  Bot, 
  User, 
  FileCheck,
  Search, 
  ExternalLink,
  Loader2
} from "lucide-react";

interface Source {
  title: string;
  page: string;
  text: string;
}

interface Question {
  id: string;
  q: string;
  a: string;
  source: Source;
}

interface Document {
  id: string;
  name: string;
  type: string;
  questions: Question[];
}

const documentData: Document[] = [
  {
    id: "handbook",
    name: "Company_Handbook.pdf",
    type: "PDF Document",
    questions: [
      {
        id: "hb-q1",
        q: "What is the hybrid remote work policy?",
        a: "According to page 4 of the Company Handbook, the hybrid policy permits employees to work remotely up to 3 days per week. All staff must be present in the office on core days (Tuesday and Thursday).",
        source: {
          title: "Company_Handbook.pdf",
          page: "Page 4",
          text: "...employees are permitted to work remotely up to 3 days per week. In-office days are Tuesday & Thursday. Attendance on core days is mandatory..."
        }
      },
      {
        id: "hb-q2",
        q: "How many annual leaves do we get?",
        a: "Full-time employees receive 25 days of annual paid leave, as documented on page 9. Accrued unused vacation can carry over to the next year, capped at a maximum of 5 days.",
        source: {
          title: "Company_Handbook.pdf",
          page: "Page 9",
          text: "...standard paid time off is 25 days per calendar year. Carrying over is capped at 5 days. Carry-over request must be approved..."
        }
      }
    ]
  },
  {
    id: "financials",
    name: "Q4_Financial_Report.xlsx",
    type: "Spreadsheet",
    questions: [
      {
        id: "fin-q1",
        q: "What was the gross revenue increase in Q4?",
        a: "As listed on page 3, gross revenue increased by 23% year-over-year, reaching $4.2M. This growth was driven by a surge in enterprise subscription renewals and professional services.",
        source: {
          title: "Q4_Financial_Report.xlsx",
          page: "Sheet 1 (P3)",
          text: "...gross revenues reached $4.2M, marking a 23% increase YoY. Subscription sales accounted for 75% of the total revenue..."
        }
      },
      {
        id: "fin-q2",
        q: "Which department saved the most budget?",
        a: "The Operations department achieved the highest savings on page 11, reducing their expenses by 14% through SaaS tool consolidation and energy-saving measures.",
        source: {
          title: "Q4_Financial_Report.xlsx",
          page: "Sheet 3 (P11)",
          text: "...Operations achieved a 14% budget saving through system consolidations. IT budget was flat. Marketing grew by 8%..."
        }
      }
    ]
  },
  {
    id: "api",
    name: "Developer_API_Guide.md",
    type: "Markdown Docs",
    questions: [
      {
        id: "api-q1",
        q: "How to authenticate API requests?",
        a: "To authenticate requests, pass a Bearer token in your HTTP Authorization header: `Authorization: Bearer <API_KEY>`, as shown on page 2.",
        source: {
          title: "Developer_API_Guide.md",
          page: "Page 2",
          text: "...authenticate client requests using headers: Authorization: Bearer <API_KEY>. Keep keys secret. Do not expose in client frontend..."
        }
      },
      {
        id: "api-q2",
        q: "What are the API rate limits?",
        a: "The API rate limits (Page 5) are 60 requests per minute for standard developer API keys, and 1,200 requests per minute for enterprise tiers.",
        source: {
          title: "Developer_API_Guide.md",
          page: "Page 5",
          text: "...rate limiting is enforced at 60 req/min for free and 1200 req/min for enterprise. Headers contain X-RateLimit-Remaining..."
        }
      }
    ]
  }
];

export function ChatPreview() {
  const [selectedDoc, setSelectedDoc] = useState<Document>(documentData[0]);
  const [selectedQ, setSelectedQ] = useState<Question | null>(null);
  
  const [typedAnswer, setTypedAnswer] = useState("");
  const [pipelineState, setPipelineState] = useState<"idle" | "embedding" | "retrieving" | "answering" | "done">("idle");
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDocSelect = (doc: Document) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setSelectedDoc(doc);
    setSelectedQ(null);
    setTypedAnswer("");
    setPipelineState("idle");
  };

  const handleQuestionSelect = (q: Question) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setSelectedQ(q);
    setTypedAnswer("");
    setPipelineState("embedding");

    // Phase 1: Embedding (800ms)
    setTimeout(() => {
      setPipelineState("retrieving");
      
      // Phase 2: Retrieval (800ms)
      setTimeout(() => {
        setPipelineState("answering");
        
        // Phase 3: Typing Answer
        let charIndex = 0;
        const words = q.a.split(" ");
        setTypedAnswer("");

        typingTimerRef.current = setInterval(() => {
          if (charIndex < words.length) {
            setTypedAnswer((prev) => prev + (prev ? " " : "") + words[charIndex]);
            charIndex++;
          } else {
            if (typingTimerRef.current) clearInterval(typingTimerRef.current);
            setPipelineState("done");
          }
        }, 80); // Speed of word typing

      }, 800);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="absolute top-1/4 right-0 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-30 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-fluid-h2 font-bold tracking-tight text-white mb-4"
          >
            RAG Sandbox Simulator
          </motion.h2>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
            Interact with our semantic pipeline. Select a document, click a sample question, and watch the retrieval-augmented database in action.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 max-w-6xl mx-auto items-start">
          
          {/* Left Panel: Simulator Controller (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Document Selection Card */}
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-6 backdrop-blur-md">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Step 1: Choose Knowledge Base</h3>
              <div className="flex flex-col gap-2">
                {documentData.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSelect(doc)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDoc.id === doc.id
                        ? "bg-primary/10 border-primary text-white"
                        : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <FileText className={`h-5 w-5 ${selectedDoc.id === doc.id ? "text-primary" : "text-text-muted"}`} />
                    <div>
                      <p className="text-sm font-semibold">{doc.name}</p>
                      <p className="text-[10px] text-text-muted">{doc.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Question Selection Card */}
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-6 backdrop-blur-md">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Step 2: Submit Semantic Query</h3>
              <div className="flex flex-col gap-2">
                {selectedDoc.questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionSelect(q)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer ${
                      selectedQ?.id === q.id
                        ? "bg-secondary/10 border-secondary text-white"
                        : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <HelpCircle className={`h-4 w-4 shrink-0 mt-0.5 ${selectedQ?.id === q.id ? "text-secondary" : "text-text-muted"}`} />
                    <span className="font-medium">{q.q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Live RAG Pipeline Flow Indicator */}
            <div className="rounded-2xl border border-white/5 bg-surface/30 p-6 backdrop-blur-md">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Pipeline Status</h3>
              <div className="space-y-4">
                
                {/* Flow Step 1: Embedding */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors font-semibold ${
                    pipelineState === "embedding" ? "bg-primary/20 border-primary text-primary animate-pulse" : 
                    pipelineState !== "idle" ? "bg-primary/10 border-primary/30 text-primary" : "border-white/10 text-text-muted"
                  }`}>
                    {pipelineState === "embedding" ? <Loader2 className="h-4 w-4 animate-spin" /> : "1"}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${pipelineState !== "idle" ? "text-white" : "text-text-muted"}`}>Vectorize Query</p>
                    <p className="text-[10px] text-text-muted">Generate dense embedding matrix</p>
                  </div>
                </div>

                {/* Flow Step 2: Retrieval */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors font-semibold ${
                    pipelineState === "retrieving" ? "bg-secondary/20 border-secondary text-secondary animate-pulse" : 
                    ["answering", "done"].includes(pipelineState) ? "bg-secondary/10 border-secondary/30 text-secondary" : "border-white/10 text-text-muted"
                  }`}>
                    {pipelineState === "retrieving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "2"}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${["retrieving", "answering", "done"].includes(pipelineState) ? "text-white" : "text-text-muted"}`}>Retrieve Context</p>
                    <p className="text-[10px] text-text-muted">Cosine search over document chunks</p>
                  </div>
                </div>

                {/* Flow Step 3: LLM Generation */}
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors font-semibold ${
                    pipelineState === "answering" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse" : 
                    pipelineState === "done" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/10 text-text-muted"
                  }`}>
                    {pipelineState === "answering" ? <Loader2 className="h-4 w-4 animate-spin" /> : "3"}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${pipelineState === "done" || pipelineState === "answering" ? "text-white" : "text-text-muted"}`}>LLM Generation</p>
                    <p className="text-[10px] text-text-muted">Stream context-grounded response</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Panel: Simulated Chat Workspace (7 columns) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-surface shadow-2xl relative overflow-hidden flex flex-col min-h-[480px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-surface-secondary/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-white">Active session</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono bg-white/5 px-2.5 py-1 rounded-full border border-white/5">RAG-AGENT-v2</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* If idle state */}
              {pipelineState === "idle" && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-bounce">
                    <Database className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">RAG Pipeline Simulator</h4>
                  <p className="text-xs text-text-muted max-w-xs">
                    Choose a document on the left and trigger a question to preview the similarity search flow.
                  </p>
                </div>
              )}

              {/* Chat messages */}
              {pipelineState !== "idle" && (
                <div className="space-y-6">
                  {/* User Message */}
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary border border-white/5 text-text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-text-muted font-mono mb-1">USER QUERY</p>
                      <p className="text-sm font-medium text-white">{selectedQ?.q}</p>
                    </div>
                  </div>

                  {/* Assistant response */}
                  {["retrieving", "answering", "done"].includes(pipelineState) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 border-t border-white/5 pt-6"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary text-white shadow-primary-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-xs text-primary font-mono mb-1 font-bold">RAG RESPONSE</p>
                          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line font-sans">
                            {typedAnswer}
                            {pipelineState === "answering" && (
                              <span className="inline-block h-3.5 w-1.5 ml-1 bg-primary animate-pulse" />
                            )}
                          </p>
                        </div>

                        {/* Citation Panel */}
                        {pipelineState === "done" && selectedQ && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <FileCheck className="h-4 w-4 text-primary" />
                              <span className="text-xs font-semibold text-white">Retrieved Citation [1]</span>
                              <span className="text-[10px] text-text-muted ml-auto font-mono">{selectedQ.source.page}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-text-secondary italic font-mono bg-black/20 p-2.5 rounded-lg border border-white/5">
                              "{selectedQ.source.text}"
                            </p>
                            <div className="mt-3 flex items-center gap-4 text-[10px]">
                              <span className="text-emerald-400 font-mono font-semibold">Similarity: 96.2%</span>
                              <button className="flex items-center gap-1 text-primary hover:text-white transition-colors cursor-pointer ml-auto">
                                Open Original Document <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Processing loader */}
                  {pipelineState === "embedding" && (
                    <div className="flex items-center gap-3 text-text-muted py-2 border-t border-white/5 pt-6">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs font-mono">Vectorizing prompt token array...</span>
                    </div>
                  )}

                  {pipelineState === "retrieving" && (
                    <div className="flex items-center gap-3 text-text-muted py-2 border-t border-white/5 pt-6">
                      <Search className="h-4 w-4 animate-spin text-secondary" />
                      <span className="text-xs font-mono">Scanning vector dimensions index...</span>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
