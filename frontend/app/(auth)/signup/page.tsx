'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { validateEmail, validatePassword } from '@/lib/utils/validation';
import {
  Eye, EyeOff, Mail, Lock, UserPlus, Loader2,
  AlertCircle, Sparkles, CheckCircle2, XCircle,
} from 'lucide-react';

// Password strength helpers
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'bg-white/10' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-error' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-warning' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-secondary' };
  return { score, label: 'Strong', color: 'bg-success' };
}

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, login, isAuthenticated, _hasHydrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string; general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);

  // Redirect already-authenticated users
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/chat');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address';

    const pwResult = validatePassword(password);
    if (!password) errs.password = 'Password is required';
    else if (!pwResult.valid) errs.password = pwResult.error;

    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

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
      // Step 1: Create account
      await signup({ email, password });

      // Step 2: Auto-login after signup
      await login({ email, password });

      setSuccess(true);
      router.push('/chat');
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error?.message ||
        'Failed to create account. Please try again.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md z-10"
      >
        <div className="glass-card rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.35)]"
            >
              <img src="/lumina_logo.png" alt="Lumina Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Create your account</h1>
            <p className="text-text-secondary text-sm">Start chatting with your documents today</p>
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
                    focus:bg-white/8 focus:border-secondary/60 focus:ring-2 focus:ring-secondary/20
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
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="Create a strong password"
                  disabled={isLoading || success}
                  className={`
                    w-full h-11 pl-10 pr-12 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                    bg-white/5 border transition-all outline-none
                    focus:bg-white/8 focus:border-secondary/60 focus:ring-2 focus:ring-secondary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.password ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                  `}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-0.5">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      {requirements.map(req => (
                        <span key={req.label} className="flex items-center gap-1 text-xs">
                          {req.test(password)
                            ? <CheckCircle2 className="w-3 h-3 text-success" />
                            : <XCircle className="w-3 h-3 text-text-muted" />}
                          <span className={req.test(password) ? 'text-success' : 'text-text-muted'}>{req.label}</span>
                        </span>
                      ))}
                    </div>
                    {strength.label && (
                      <span className={`text-xs font-medium ${
                        strength.score <= 1 ? 'text-error' :
                        strength.score <= 2 ? 'text-warning' :
                        strength.score <= 3 ? 'text-secondary' : 'text-success'
                      }`}>{strength.label}</span>
                    )}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-error text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                  placeholder="Repeat your password"
                  disabled={isLoading || success}
                  className={`
                    w-full h-11 pl-10 pr-12 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                    bg-white/5 border transition-all outline-none
                    focus:bg-white/8 focus:border-secondary/60 focus:ring-2 focus:ring-secondary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.confirmPassword ? 'border-error/60 bg-error/5' :
                      confirmPassword && confirmPassword === password ? 'border-success/40' :
                      'border-white/10 hover:border-white/20'}
                  `}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-0.5">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-error text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                  </motion.p>
                )}
                {confirmPassword && confirmPassword === password && !errors.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-success text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />Passwords match
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
                w-full h-11 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-secondary/90 to-primary/90
                text-white border border-secondary/40
                shadow-lg shadow-secondary/20
                transition-all duration-200
                hover:shadow-xl hover:shadow-secondary/30
                disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
              ) : success ? (
                <><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>Redirecting…</>
              ) : (
                <><UserPlus className="w-4 h-4" />Create Account</>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          By signing up you agree to our terms · Data encrypted at rest
        </p>
      </motion.div>
    </div>
  );
}
