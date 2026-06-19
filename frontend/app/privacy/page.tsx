'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-md shadow-xl text-left space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Last Updated: June 19, 2026</p>
            
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              At Lumina, we prioritize your data security and user privacy. This Privacy Policy details how we handle files, indexing vectors, API keys, and account records when you use our services.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">1. Document Index Data Isolation</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              All files uploaded (PDFs, Markdown, CSVs) are automatically parsed, split into text chunks, and converted to vector embeddings. These embeddings are stored locally within our vector index database and mapped strictly to your authenticated account ID.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">2. Third-Party LLM Gateway Interactions</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Lumina acts as a retrieval gateway. When a query is made, we retrieve matching document chunks and submit them alongside your question to third-party APIs (such as Google Gemini or Groq Llama backends). These inputs are governed by the respective APIs' developer privacy policies. If you supply custom API keys, queries bypass our default billing endpoints entirely.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">3. Data Retention and Destruction</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              You retain full control over your data. Deleting a document removes both the file record and its associated vector embeddings from our index. Triggering account deletion completely wipes all user logs, settings, and vector structures from our live database nodes immediately.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">4. Policy Modifications</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              We may revise this policy periodically to reflect platform upgrades. Users will be notified of material changes via dashboard updates.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
