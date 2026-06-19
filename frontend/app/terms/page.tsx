'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-md shadow-xl text-left space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
            <p className="text-[11px] text-text-muted uppercase tracking-wider font-bold">Last Updated: June 19, 2026</p>
            
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Welcome to Lumina. By accessing or using our document indexing workspace and RAG assistant services, you agree to comply with the terms and guidelines outlined below.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">1. Authorized Platform Use</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Lumina provides document vector indexing and natural language querying capabilities. You are responsible for ensuring that all files uploaded to the service comply with local laws and copyright parameters. You may not upload harmful material or perform automated high-frequency vector abuse.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">2. API Gateways & Account Limits</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Free and professional plan users are allotted specific file size and query quotas. Attempting to bypass limits through multi-account setups or scraping is strictly prohibited. Custom API keys provided by the user are subject to their respective developer API terms.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">3. Limitation of Liability</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              Lumina acts as a retrieval gateway. We do not guarantee the structural accuracy of large language model answers. Responses are citation-grounded based on provided files, but must be audited by users for critical business or legal execution.
            </p>

            <h2 className="text-lg font-bold text-white pt-2 border-t border-white/5">4. Agreement Termination</h2>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              We reserve the right to suspend or terminate accounts that breach platform usage rules or participate in unauthorized data extraction.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
