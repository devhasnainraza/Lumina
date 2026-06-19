'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Target, Shield, Heart } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/3 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/3 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold sm:text-5xl text-white tracking-tight leading-tight">
              Our Mission: Citation-Grounded Integrity
            </h1>
            <p className="text-lg text-text-secondary mt-4 max-w-3xl mx-auto leading-relaxed">
              We build tools that transform raw, unstructured files into context-aware systems, prioritizing privacy, grounding, and multi-model flexibility.
            </p>
          </div>

          {/* Values Row */}
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md text-left space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Focus on Accuracy</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Lumina maps, parses, and retrieves direct page-level citations, eliminating hallucinations and grounding all answers in verifiable records.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md text-left space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Privacy First</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                We believe your documents belong to you. Lumina uses localized pgvector indexes and provides custom API key pathways for absolute data isolation.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md text-left space-y-4">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Open & Scalable</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Lumina is engineered using the best in modern web tech (Next.js, FastAPI, Tailwind CSS) to scale effortlessly from personal research to enterprise data.
              </p>
            </div>
          </div>

          {/* Detailed Paragraph Section */}
          <div className="p-8 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-md space-y-6 text-left shadow-xl">
            <h2 className="text-xl font-bold text-white">The Lumina Story</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Lumina started as a project to bridge the gap between large language models and proprietary knowledge bases. Traditional search engines failed to retrieve precise semantic sections, while chat assistants frequently hallucinated facts. By engineering a hybrid keyword and vector parsing pipeline, we constructed a system that grounds responses in actual document text.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Today, Lumina serves researchers, engineering teams, and businesses looking to interrogate documentation safely. We support seamless integrations with Gemini and Llama backends, allowing users to customize their retrieval creativity and context thresholds.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
