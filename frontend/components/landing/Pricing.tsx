"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    description: "Core semantic search features for individuals exploring RAG capabilities.",
    features: [
      "Up to 5 documents (PDF, Markdown)",
      "100 queries / month",
      "Standard vector indexing speed",
      "Semantic similarity retrieval",
      "Page-level source citations",
      "Community support"
    ],
    cta: "Get Started Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Professional",
    price: { monthly: 29, yearly: 23 },
    description: "The complete toolbox for professionals and small teams building intelligent systems.",
    features: [
      "Up to 100 documents (Unlimited size)",
      "Unlimited semantic queries",
      "High-speed document parsing",
      "Hybrid RAG search (Keyword + Semantic)",
      "API & Webhook integration keys",
      "Custom system prompts & model tuning",
      "Priority email/chat support (12h SLA)",
      "50 GB secure cloud storage"
    ],
    cta: "Start 14-Day Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    price: { monthly: "Custom", yearly: "Custom" },
    description: "Enterprise-grade control, security, and custom fine-tuned pipelines.",
    features: [
      "Unlimited document indexing",
      "Dedicated high-throughput model node",
      "Fine-tuned domain-specific embeddings",
      "Role-Based Access Control (RBAC)",
      "Custom SSO/SAML login setup",
      "On-premise / private cloud deploy option",
      "24/7 dedicated support manager",
      "99.9% uptime service level agreement"
    ],
    cta: "Contact Enterprise Sales",
    href: "/signup",
    popular: false,
  }
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-24 relative overflow-hidden" id="pricing">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full glow-blob-primary opacity-30 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-fluid-h2 font-bold tracking-tight text-white mb-4"
          >
            Transparent, Scale-Ready Pricing
          </motion.h2>
          <p className="text-base sm:text-lg text-text-secondary">
            Start completely free. Upgrade when your vector database needs expand. All premium plans include a 14-day trial.
          </p>

          {/* Toggle Switch */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-white" : "text-text-muted"}`}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary/20 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-primary shadow ring-0 transition duration-200 ease-in-out ${
                  billingPeriod === "yearly" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-white" : "text-text-muted"}`}>Yearly</span>
              <span className="inline-flex items-center rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary animate-pulse">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isYearly = billingPeriod === "yearly";
            const priceVal = plan.price[billingPeriod];
            const displayPrice = typeof priceVal === "number" ? `$${priceVal}` : priceVal;

             return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col justify-between rounded-2xl p-8 backdrop-blur-md transition-all duration-300 border ${
                  plan.popular
                    ? "bg-surface/90 border-primary/50 shadow-[0_0_40px_rgba(124,58,237,0.3)] scale-[1.03] z-10 md:-translate-y-2 ring-1 ring-primary/40"
                    : "bg-surface/40 border-white/5 hover:border-white/20 hover:bg-surface/60 hover:scale-[1.01] hover:shadow-2xl"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-primary/30 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white tracking-wide">{plan.name}</h3>
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{displayPrice}</span>
                    {typeof priceVal === "number" && (
                      <span className="text-sm text-text-muted font-medium">/ month</span>
                    )}
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-6 border-b border-white/5 pb-6 font-sans">
                    {plan.description}
                  </p>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 mt-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm text-text-secondary font-sans">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    plan.popular
                      ? "bg-primary text-white shadow-primary-sm hover:shadow-primary-md hover:bg-primary/95"
                      : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
