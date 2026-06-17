'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Book, Code, Zap, Shield, Database, MessageSquare } from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    icon: Book,
    items: [
      { title: 'Introduction', description: 'Learn about Lumina and its features' },
      { title: 'Quick Start', description: 'Get up and running in 5 minutes' },
      { title: 'Installation', description: 'Step-by-step installation guide' },
    ],
  },
  {
    title: 'Features',
    icon: Zap,
    items: [
      { title: 'Document Upload', description: 'Upload and process PDF, DOCX, and TXT files' },
      { title: 'RAG Search', description: 'Advanced retrieval-augmented generation' },
      { title: 'AI Chat', description: 'Intelligent conversations with source citations' },
    ],
  },
  {
    title: 'API Reference',
    icon: Code,
    items: [
      { title: 'Authentication', description: 'JWT-based authentication endpoints' },
      { title: 'Documents API', description: 'Upload and manage documents' },
      { title: 'Chat API', description: 'Create and manage chat sessions' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'Authentication', description: 'Secure user authentication with JWT' },
      { title: 'Data Privacy', description: 'How we protect your data' },
      { title: 'Best Practices', description: 'Security recommendations' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h1
              className="mb-4 text-4xl font-bold sm:text-5xl"
              style={{ color: '#F9FAFB' }}
            >
              Documentation
            </h1>
            <p className="text-lg" style={{ color: '#D1D5DB' }}>
              Everything you need to know about Lumina
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {sections.map((section, index) => (
              <div key={index}>
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background:
                        'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                    }}
                  >
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: '#F9FAFB' }}
                  >
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-4 transition-all hover:scale-105"
                      style={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <h3
                        className="mb-1 text-lg font-semibold"
                        style={{ color: '#F9FAFB' }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm" style={{ color: '#D1D5DB' }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-16 rounded-2xl p-8"
            style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                }}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3
                  className="mb-2 text-xl font-bold"
                  style={{ color: '#F9FAFB' }}
                >
                  Need Help?
                </h3>
                <p className="mb-4" style={{ color: '#D1D5DB' }}>
                  Can't find what you're looking for? Our support team is here
                  to help.
                </p>
                <a
                  href="/contact"
                  className="inline-block rounded-lg px-6 py-2 text-sm font-medium text-white transition-all"
                  style={{ backgroundColor: '#7C3AED' }}
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
