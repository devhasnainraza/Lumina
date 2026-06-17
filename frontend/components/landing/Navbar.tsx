"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-background/85 border-b border-border shadow-lg shadow-black/20 backdrop-blur-md py-3" 
          : "bg-transparent border-b border-white/5 py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img src="/lumina_logo.png" alt="Lumina Logo" className="h-full w-auto object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              Lumina
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="group flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-primary-sm hover:shadow-primary-md hover:bg-primary/95 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-text-primary md:hidden hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-b border-white/5 bg-background/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6 border-t border-white/5">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-text-secondary hover:text-white transition-colors py-2 border-b border-white/5"
              >
                Dashboard
              </Link>
              <Link
                href="/docs"
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-text-secondary hover:text-white transition-colors py-2 border-b border-white/5"
              >
                Docs
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-text-secondary hover:text-white transition-colors py-2 border-b border-white/5"
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl border border-white/10 text-base font-medium text-text-primary hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl bg-primary text-base font-medium text-white shadow-primary-sm hover:opacity-95 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
