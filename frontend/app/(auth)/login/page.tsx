'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { validateEmail } from '@/lib/utils/validation';
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, _hasHydrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect already-authenticated users (middleware handles server side, this handles client side)
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      const next = searchParams.get('redirect') || '/chat';
      router.replace(next);
    }
  }, [_hasHydrated, isAuthenticated, router, searchParams]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      setSuccess(true);
      const next = searchParams.get('redirect') || '/chat';
      router.push(next);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Invalid email or password. Please try again.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Show nothing while checking hydration (middleware already redirects server-side)
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md z-10"
      >
        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-4"
            >
              <Sparkles className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h1>
            <p className="text-text-secondary text-sm">Sign in to your AI Knowledge Base</p>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/25 text-error text-sm overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errors.general}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                  placeholder="you@example.com"
                  disabled={isLoading || success}
                  className={`
                    w-full h-11 pl-10 pr-4 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                    bg-white/5 border transition-all outline-none
                    focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.email ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                  `}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-error text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  disabled={isLoading || success}
                  className={`
                    w-full h-11 pl-10 pr-12 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                    bg-white/5 border transition-all outline-none
                    focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.password ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-error text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || success}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="
                relative w-full h-11 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-primary to-primary/80
                text-white border border-primary/50
                shadow-lg shadow-primary/25
                transition-all duration-200
                hover:shadow-xl hover:shadow-primary/35 hover:from-primary hover:to-primary
                disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : success ? (
                <>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>
                  Redirecting…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
            >
              Create one for free
            </Link>
          </p>
        </div>

        {/* Bottom tag */}
        <p className="mt-4 text-center text-xs text-text-muted">
          Protected by JWT authentication · 256-bit encryption
        </p>
      </motion.div>
    </div>
  );
}
