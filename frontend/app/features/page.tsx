'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ShieldCheck, Cpu, Database, Sparkles, MessageSquare, HardDrive } from 'lucide-react';
import Link from 'next/link';

const featureList = [
  {
    title: 'Hybrid Semantic Retrieval',
    desc: 'Combines traditional keyword search with advanced vector database embeddings (pgvector) to provide high-precision context retrieval.',
    icon: Database,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  },
  {
    title: 'Citation Integrity Engine',
    desc: 'Every response is grounded directly in your uploaded source files, outputting clear, clickable page-level citations to eliminate hallucination.',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Multi-Model Tuning Gateway',
    desc: 'Toggle between state-of-the-art models like Gemini 1.5 Pro and Llama 3.3, and tune creativity temperature and context depth in real-time.',
    icon: Cpu,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Cognitive Workspace Storage',
    desc: 'Upload files (PDF, Markdown, CSV, Word) up to 2MB. All files are automatically parsed, chunked, and embedded into local vector indexes.',
    icon: HardDrive,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10'
  },
  {
    title: 'Interactive Chat Experience',
    desc: 'Clean message bubble streams with syntax highlighters, follow-up recommendations, suggestion presets, and full chat sessions memory.',
    icon: MessageSquare,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    title: 'System Prompt Customization',
    desc: 'Override system prompts inside Settings to fine-tune Lumina to act as a custom code tutor, business analyst, or customer helper.',
    icon: Sparkles,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10'
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h1 className="text-4xl font-extrabold sm:text-5xl text-white tracking-tight leading-tight">
              Engineered for Contextual Intelligence
            </h1>
            <p className="text-lg text-text-secondary mt-4 leading-relaxed">
              Explore the core components that make Lumina a premium, secure, and lightning-fast Retrieval-Augmented Generation assistant.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
            {featureList.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-md hover:border-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed font-sans">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Banner */}
          <div className="mt-20 max-w-4xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl">
            <div className="text-left">
              <h3 className="text-xl font-bold text-white">Ready to index your knowledge?</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xl font-sans">
                Create a free account, upload your documents, and start querying your custom vector indexing space in minutes.
              </p>
            </div>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary/95 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
