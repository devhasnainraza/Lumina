"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="py-16 border-t border-white/5 bg-surface-secondary/20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-b border-white/5 pb-12">
          
          {/* Column 1: Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-secondary transition-transform duration-300 group-hover:scale-105">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                AI Knowledge
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              Supercharge files with cognitive semantic memory. Upload documents and query with citation-grounded integrity.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-xs font-medium font-sans">
              <li>
                <Link href="/features" className="text-text-secondary hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-secondary hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-text-secondary hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2 text-xs font-medium font-sans">
              <li>
                <Link href="/about" className="text-text-secondary hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-text-secondary hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Legal</h4>
            <ul className="space-y-2 text-xs font-medium font-sans">
              <li>
                <Link href="/privacy" className="text-text-secondary hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-secondary hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Subscribe</h4>
            <p className="text-[11px] text-text-muted leading-relaxed font-sans">
              Subscribe to get RAG updates and vector search optimization notes.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold py-1.5">
                <CheckCircle2 className="h-4.5 w-4.5" /> Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-xs text-text-muted font-sans">
          <p>© {new Date().getFullYear()} AI Knowledge Chatbot. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
