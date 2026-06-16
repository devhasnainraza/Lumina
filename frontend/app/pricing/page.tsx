'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out AI Knowledge Chatbot',
    features: [
      '5 documents',
      '100 queries per month',
      'Basic RAG search',
      'Email support',
      '1 GB storage',
    ],
    cta: 'Get Started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For professionals and small teams',
    features: [
      '100 documents',
      'Unlimited queries',
      'Advanced RAG search',
      'Priority support',
      '50 GB storage',
      'Custom AI models',
      'API access',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited documents',
      'Unlimited queries',
      'Enterprise RAG search',
      'Dedicated support',
      'Unlimited storage',
      'Custom integrations',
      'SLA guarantee',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1020' }}>
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h1
              className="mb-4 text-4xl font-bold sm:text-5xl"
              style={{ color: '#F9FAFB' }}
            >
              Simple, transparent pricing
            </h1>
            <p className="text-lg" style={{ color: '#D1D5DB' }}>
              Choose the plan that's right for you. All plans include a 14-day
              free trial.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <div
                key={index}
                className="relative rounded-2xl p-8 transition-all hover:scale-105"
                style={{
                  backgroundColor: '#111827',
                  border: plan.popular
                    ? '2px solid #7C3AED'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: plan.popular
                    ? '0 0 40px rgba(124, 58, 237, 0.3)'
                    : 'none',
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: '#F9FAFB' }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: '#F9FAFB' }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: '#9CA3AF' }}>
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#D1D5DB' }}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check
                        className="h-5 w-5 shrink-0"
                        style={{ color: '#7C3AED' }}
                      />
                      <span className="text-sm" style={{ color: '#D1D5DB' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className="block w-full rounded-lg py-3 text-center text-sm font-medium transition-all"
                  style={{
                    backgroundColor: plan.popular ? '#7C3AED' : '#1F2937',
                    color: 'white',
                    border: plan.popular
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div
            className="mt-16 rounded-2xl p-8 text-center"
            style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2
              className="mb-4 text-2xl font-bold"
              style={{ color: '#F9FAFB' }}
            >
              Need a custom solution?
            </h2>
            <p className="mb-6 text-lg" style={{ color: '#D1D5DB' }}>
              Contact our sales team for enterprise pricing and custom
              integrations.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-lg px-6 py-3 text-sm font-medium text-white transition-all"
              style={{ backgroundColor: '#7C3AED' }}
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
