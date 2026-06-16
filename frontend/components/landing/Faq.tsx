"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is Retrieval-Augmented Generation (RAG)?",
    answer: "RAG is an AI framework that retrieves relevant context from your private document repository before feeding a query to the LLM. This guarantees answers are directly grounded in your data, preventing hallucinations and ensuring high fidelity."
  },
  {
    question: "How secure are my uploaded documents?",
    answer: "Your security is our top priority. All indexed files are encrypted at rest and in transit. Document vectors are isolated on tenant-specific namespaces, and your original data is never utilized for public base model training."
  },
  {
    question: "What file formats does the system support?",
    answer: "We support PDF, DOCX (Word), TXT, Markdown (.md), and CSV/XLSX spreadsheets. Our ingestion pipeline parses tables, headers, and code snippets, matching them to clean chunks automatically."
  },
  {
    question: "Can I connect this to custom AI models?",
    answer: "Yes. Pro and Enterprise customers can select their preferred backend LLM (including Gemini, Claude, or custom OpenAI endpoints) and configure custom system prompts for specialized brand voices."
  },
  {
    question: "How does vector pricing/storage scaling work?",
    answer: "Free plan accounts have up to 5 documents. The Professional plan opens up 100 documents with high-performance embedding pipelines, while Enterprise scales to millions of vector coordinates on isolated nodes."
  }
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 border-t border-white/5 relative overflow-hidden" id="faq">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-fluid-h2 font-bold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-text-secondary">
            Got questions about vector indexing, security, or setup? We have answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="rounded-2xl border border-white/5 bg-surface/30 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-6 text-left text-white font-medium focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-3 text-base sm:text-lg">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-text-muted transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 text-sm sm:text-base leading-relaxed text-text-secondary font-sans border-t border-white/5">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
