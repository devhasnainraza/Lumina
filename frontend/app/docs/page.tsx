'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Book, Code, Zap, Shield, Database, MessageSquare, X, Terminal, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sections: {
  title: string;
  icon: any;
  items: {
    title: string;
    description: string;
    details: React.ReactNode;
  }[];
}[] = [
  {
    title: 'Getting Started',
    icon: Book,
    items: [
      { 
        title: 'Introduction', 
        description: 'Learn about Lumina and its core RAG assistant features',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>
              Lumina is an advanced Retrieval-Augmented Generation (RAG) assistant designed to convert your private files into an interactive knowledge base. 
            </p>
            <p>
              By chunking, indexing, and storing your documents in a high-performance vector database, Lumina lets you query complex guides and receive citation-grounded answers immediately.
            </p>
            <h4 className="text-white font-bold text-base mt-6 mb-2 font-sans">Key Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white">Verifiable Citations</strong>: Every answer includes page-level citations.
              </li>
              <li>
                <strong className="text-white">Multi-Model Support</strong>: Swap between Gemini 1.5 Pro and Llama 3.3.
              </li>
              <li>
                <strong className="text-white">API Access</strong>: Connect and feed vector indexes into your workflows.
              </li>
            </ul>
          </div>
        )
      },
      { 
        title: 'Quick Start', 
        description: 'Get up and running with document querying in 5 minutes',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>Follow these simple steps to start querying:</p>
            <ol className="list-decimal pl-5 space-y-3 font-sans">
              <li>
                <strong className="text-white">Create Account</strong>: Go to the signup page and verify credentials.
              </li>
              <li>
                <strong className="text-white">Upload Documents</strong>: Navigate to the <strong className="text-white">Documents</strong> tab and drag-and-drop your PDFs, Markdown, Word, or CSV files.
              </li>
              <li>
                <strong className="text-white">Open Chat</strong>: Click the <strong className="text-white">Chat</strong> tab and ask queries (e.g. <span className="text-cyan-400 italic">"Summarize the contract agreement"</span>).
              </li>
              <li>
                <strong className="text-white">Inspect Sources</strong>: Click the green citation labels (e.g. <span className="text-green-400 font-semibold">[Source 1]</span>) under responses to view exact document paragraphs.
              </li>
            </ol>
          </div>
        )
      },
      { 
        title: 'Installation', 
        description: 'Step-by-step local installation and environment setup guide',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>To set up the Lumina repository locally, run the following commands:</p>
            <div className="relative bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-xs overflow-x-auto text-white space-y-3 leading-loose">
              <div>
                <span className="text-text-muted"># 1. Clone codebase</span>
                <br />
                git clone https://github.com/username/Lumina.git
                <br />
                cd Lumina
              </div>
              <div>
                <span className="text-text-muted"># 2. Setup backend</span>
                <br />
                cd backend
                <br />
                python -m venv venv
                <br />
                source venv/bin/activate
                <br />
                pip install -r requirements.txt
                <br />
                uvicorn src.main:app --reload
              </div>
              <div>
                <span className="text-text-muted"># 3. Setup frontend</span>
                <br />
                cd ../frontend
                <br />
                npm install
                <br />
                npm run dev
              </div>
            </div>
            <p className="text-xs text-text-muted">
              Make sure to configure the corresponding variables in your <code className="text-primary font-mono bg-white/5 px-1.5 py-0.5 rounded">.env</code> and <code className="text-primary font-mono bg-white/5 px-1.5 py-0.5 rounded">.env.local</code> files.
            </p>
          </div>
        )
      },
    ],
  },
  {
    title: 'Features',
    icon: Zap,
    items: [
      { 
        title: 'Document Upload', 
        description: 'Upload and process PDF, DOCX, and TXT files under 2MB',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>Lumina processes files securely. When a file is uploaded:</p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white">Parsing</strong>: The file content is extracted and normalized.
              </li>
              <li>
                <strong className="text-white">Recursive Chunking</strong>: Text is split into overlapping chunks to preserve semantic context.
              </li>
              <li>
                <strong className="text-white">Index Injection</strong>: pgvector creates 1536-dimensional embeddings.
              </li>
            </ul>
            <p className="text-xs text-cyan-400 italic font-semibold mt-4">
              *Note: Individual file sizes are limited to 2MB to maintain high retrieval speeds.*
            </p>
          </div>
        )
      },
      { 
        title: 'RAG Search', 
        description: 'Advanced hybrid retrieval-augmented generation insights',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>Lumina uses hybrid semantic search to locate context:</p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white">Vector Similarity</strong>: Calibrates Cosine Distance against index embeddings.
              </li>
              <li>
                <strong className="text-white">Keyword Matching</strong>: Ensures SKUs, exact codes, and names are matched correctly.
              </li>
              <li>
                <strong className="text-white">Rerank Tuning</strong>: Sorts findings and feeds the top chunks directly to the active LLM context window.
              </li>
            </ul>
          </div>
        )
      },
      { 
        title: 'AI Chat', 
        description: 'Intelligent conversations with source citations and controls',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>The chat interface allows you to:</p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>Tune creativity (temperature) and context depth in real-time.</li>
              <li>View suggested follow-up questions dynamically parsed from responses.</li>
              <li>Clear screen instantly or toggle chat history sessions.</li>
            </ul>
          </div>
        )
      },
    ],
  },
  {
    title: 'API Reference',
    icon: Code,
    items: [
      { 
        title: 'Authentication', 
        description: 'JWT-based security token parameters',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>All backend endpoints require a valid JWT bearer token.</p>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mt-4">Header Format:</h4>
            <pre className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-xs text-white">
              Authorization: Bearer &lt;your_jwt_token&gt;
            </pre>
            <p className="text-xs text-text-muted mt-2">
              Request a token by posting user credentials to the login route:
              <br />
              <code className="text-cyan-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">POST /api/auth/login</code>
            </p>
          </div>
        )
      },
      { 
        title: 'Documents API', 
        description: 'Endpoints to upload and manage documents',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>Manage your vector index programmatically:</p>
            <div className="space-y-4">
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-wider">1. Upload File</h5>
                <pre className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-xs text-white mt-1">
                  POST /api/documents/upload{"\n"}
                  Content-Type: multipart/form-data
                </pre>
              </div>
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-wider">2. List Documents</h5>
                <pre className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-xs text-white mt-1">
                  GET /api/documents
                </pre>
              </div>
              <div>
                <h5 className="text-white font-bold text-xs uppercase tracking-wider">3. Delete Document</h5>
                <pre className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-xs text-white mt-1">
                  DELETE /api/documents/{"{"}document_id{"}"}
                </pre>
              </div>
            </div>
          </div>
        )
      },
      { 
        title: 'Chat API', 
        description: 'Endpoints to create and manage chat sessions',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>Engage with the RAG stream using the streaming endpoint:</p>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mt-4">Chat Query</h5>
            <pre className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-xs text-white mt-1">
              POST /api/chat{"\n"}
              Content-Type: application/json{"\n\n"}
              {"{"}{"\n"}
              {"  "}"query": "Who is the primary contact?",{"\n"}
              {"  "}"session_id": "optional-session-uuid"{"\n"}
              {"}"}
            </pre>
            <p className="text-xs text-text-muted">
              Returns a Server-Sent Events (SSE) stream of assistant token chunks.
            </p>
          </div>
        )
      },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { 
        title: 'Data Privacy', 
        description: 'Zero-retention index policy & document isolation',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>We enforce a strict data security policy:</p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>
                <strong className="text-white">Isolated Embedding Space</strong>: Your documents are mapped strictly to your account ID.
              </li>
              <li>
                <strong className="text-white">Permanent Wipes</strong>: Deleting a document instantly deletes both the raw file and its pgvector chunks.
              </li>
              <li>
                <strong className="text-white">SSO Options</strong>: Enterprise customers can deploy on-premise for absolute control.
              </li>
            </ul>
          </div>
        )
      },
      { 
        title: 'Best Practices', 
        description: 'Security configurations & API key safety recommendations',
        details: (
          <div className="space-y-4 font-sans text-text-secondary leading-relaxed">
            <p>To protect your deployment:</p>
            <ul className="list-disc pl-5 space-y-2 font-sans">
              <li>Use strong credentials and change passwords inside the settings console.</li>
              <li>Store your Google Gemini / Groq API keys locally. Lumina encrypts custom keys before database storage.</li>
              <li>Periodically clear old sessions.</li>
            </ul>
          </div>
        )
      },
    ],
  },
];

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; details: React.ReactNode } | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl text-white tracking-tight">
              Documentation Console
            </h1>
            <p className="text-lg text-text-secondary">
              Everything you need to know to configure, deploy, and interact with Lumina
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {sections.map((section, index) => (
              <div key={index}>
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                    }}
                  >
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedDoc({ title: item.title, details: item.details })}
                      className="rounded-xl p-4 transition-all hover:scale-[1.02] border border-white/5 bg-surface/30 hover:border-primary/45 hover:bg-surface/50 cursor-pointer shadow-lg group"
                    >
                      <h3 className="mb-1 text-lg font-bold text-white group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Need Help footer card */}
          <div className="mt-16 rounded-2xl p-8 bg-surface/40 border border-white/5 backdrop-blur-md shadow-xl">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                }}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="mb-2 text-xl font-bold text-white">
                  Need Help?
                </h3>
                <p className="mb-4 text-sm text-text-secondary font-sans leading-relaxed">
                  Can't find what you're looking for? Contact our support agents.
                </p>
                <a
                  href="/contact"
                  className="inline-block rounded-xl px-6 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Interactive Detail Modal/Drawer */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-10 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[650px] max-w-[95vw] h-[80vh] bg-[#0c0f1e] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-white">{selectedDoc.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 text-sm text-text-secondary font-sans leading-relaxed prose prose-invert prose-sm max-w-none">
                {selectedDoc.details}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
