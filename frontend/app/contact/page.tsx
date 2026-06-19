'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('support');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Trigger native mail client dispatch fallback
    const mailtoSubject = `Lumina Contact: ${subject.toUpperCase()} - ${name}`;
    const mailtoBody = `Name: ${name}\nEmail: ${email}\nInquiry Type: ${subject}\n\nMessage:\n${message}`;
    const mailtoUrl = `mailto:support@lumina.ai?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
    
    window.location.href = mailtoUrl;

    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Opened your default mail agent to send the ticket!');
    
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20 flex-1 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-10 left-1/4 -z-10 h-80 w-80 rounded-full glow-blob-primary opacity-20 animate-pulse" />
        <div className="absolute bottom-10 right-1/4 -z-10 h-96 w-96 rounded-full glow-blob-secondary opacity-25 animate-pulse" />

        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold sm:text-5xl text-white tracking-tight leading-tight">
              Get in Touch
            </h1>
            <p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto leading-relaxed">
              Have questions about vector setups, pricing limits, or API key configuration? Drop us a line.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-12 max-w-4xl mx-auto items-start">
            
            {/* Info pane */}
            <div className="md:col-span-5 space-y-6 text-left">
              <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  General Support
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  For account access questions, billing issues, or feature requests, contact support directly at:
                </p>
                <a href="mailto:support@lumina.ai" className="text-sm font-bold text-primary hover:underline">
                  support@lumina.ai
                </a>
              </div>

              <div className="p-6 rounded-2xl bg-surface/30 border border-white/5 backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                  Documentation Hub
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  Check out our developer guides and pgvector configuration blueprints in the documentation database.
                </p>
                <a href="/docs" className="inline-flex items-center gap-1.5 text-xs text-secondary hover:underline font-bold uppercase tracking-wider">
                  Read Documentation
                </a>
              </div>
            </div>

            {/* Form pane */}
            <div className="md:col-span-7 p-8 rounded-2xl bg-surface/40 border border-white/5 backdrop-blur-md shadow-xl text-left">
              {submitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success">
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Thank You!</h3>
                  <p className="text-xs text-text-secondary max-w-sm mx-auto font-sans leading-relaxed">
                    Your request has been received. Our team will review and reply within 12 business hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-wide"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder-text-muted/40 focus:border-primary focus:outline-none transition-colors font-sans"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder-text-muted/40 focus:border-primary focus:outline-none transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Topic Interest</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs text-white focus:border-primary focus:outline-none transition-colors font-sans"
                    >
                      <option value="support" className="bg-[#0B1020] text-white">Technical Support</option>
                      <option value="sales" className="bg-[#0B1020] text-white">Enterprise Sales Inquiry</option>
                      <option value="billing" className="bg-[#0B1020] text-white">Billing & Invoices</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Detailed Inquiry</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you are trying to build or troubleshoot..."
                      rows={5}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-xs text-white placeholder-text-muted/40 focus:border-primary focus:outline-none transition-colors resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500/95 text-white font-semibold py-3.5 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Sending Message...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
