'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Calendar, User, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const blogPosts = [
  {
    title: 'Understanding Hybrid RAG Systems: Keywords + Embeddings',
    excerpt: 'Pure semantic search can miss exact SKU codes or terms. Learn how combining keyword matching with vector retrieval creates the ultimate grounded search.',
    author: 'Muhammad Hasnain',
    date: 'Jun 18, 2026',
    readTime: '6 min read',
    tags: ['RAG', 'Vector Search'],
  },
  {
    title: 'Choosing the Right Embedding Metric: Cosine vs L2 Distance',
    excerpt: 'Cosine similarity, L2 distance, and Inner Product determine how vector matches are calculated. We break down which metric fits your document indexing needs.',
    author: 'Muhammad Hasnain',
    date: 'Jun 10, 2026',
    readTime: '5 min read',
    tags: ['Vector DB', 'Machine Learning'],
  },
  {
    title: 'Mastering System Prompts for Multi-Model Deployments',
    excerpt: 'Writing one system prompt that works seamlessly on both Gemini 1.5 Pro and Llama 3.3 is challenging. Discover strategies for prompt engineering across model APIs.',
    author: 'Muhammad Hasnain',
    date: 'May 28, 2026',
    readTime: '8 min read',
    tags: ['Prompt Engineering', 'LLM Tuning'],
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold sm:text-5xl text-white tracking-tight leading-tight">
              The Lumina Blog
            </h1>
            <p className="text-lg text-text-secondary mt-4 max-w-3xl mx-auto leading-relaxed">
              Updates, tutorials, and research notes on Retrieval-Augmented Generation, document vector search, and model tuning thresholds.
            </p>
          </div>

          {/* Posts Grid */}
          <div className="space-y-8 max-w-4xl mx-auto">
            {blogPosts.map((post, idx) => (
              <article
                key={idx}
                className="p-8 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md hover:border-white/12 hover:scale-[1.01] transition-all duration-300 text-left space-y-4 shadow-xl relative"
              >
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs text-text-muted font-sans font-medium uppercase tracking-wide">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight hover:text-primary transition-colors">
                  <a href="#">{post.title}</a>
                </h2>
                
                <p className="text-sm text-text-secondary leading-relaxed font-sans">
                  {post.excerpt}
                </p>

                {/* Tags and Link */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex gap-2">
                    {post.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-bold text-primary font-sans">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <a href="#" className="flex items-center gap-1 text-xs text-primary hover:text-primary-foreground font-semibold uppercase tracking-wider group transition-colors">
                    Read Article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
