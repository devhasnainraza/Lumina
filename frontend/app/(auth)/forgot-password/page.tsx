'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/lib/api/auth';
import { validateEmail } from '@/lib/utils/validation';
import { Eye, EyeOff, Mail, Lock, Key, ArrowLeft, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  // Flow states
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email request, 2: Token & Reset, 3: Success
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; token?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const [devTokenAlert, setDevTokenAlert] = useState<string | null>(null);

  // Validate Step 1
  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (!email) {
      errs.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errs.email = 'Enter a valid email address';
    }
    return errs;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const errs: typeof errors = {};
    if (!token) {
      errs.token = 'Reset token is required';
    }
    if (!newPassword) {
      errs.password = 'New password is required';
    } else if (newPassword.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  };

  // Handle Request Token (Step 1)
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setDevTokenAlert(null);

    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      // In development, the token is returned in the response
      if (res.token) {
        setToken(res.token);
        setDevTokenAlert('Dev Mode: Reset token received and auto-filled below!');
      }
      setStep(2);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        'Failed to request password reset code. Please try again.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset (Step 2)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(email, token, newPassword);
      setStep(3);
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        'Failed to reset password. The code might be invalid or expired.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

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
              className="inline-flex items-center justify-center w-16 h-16 mb-4 drop-shadow-[0_0_15px_rgba(124,58,237,0.35)]"
            >
              <img src="/lumina_logo.png" alt="Lumina Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Reset Password</h1>
            <p className="text-text-secondary text-sm">
              {step === 1 && 'Request a verification code to reset your account password'}
              {step === 2 && 'Enter the reset code and choose your new password'}
              {step === 3 && 'Your password has been reset successfully'}
            </p>
          </div>

          {/* Error & Dev Alerts */}
          <AnimatePresence mode="wait">
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

            {devTokenAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs overflow-hidden"
              >
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{devTokenAlert}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flow Steps */}
          {step === 1 && (
            <form onSubmit={handleRequestToken} className="space-y-5" noValidate>
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
                    disabled={isLoading}
                    className={`
                      w-full h-11 pl-10 pr-4 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                      bg-white/5 border transition-all outline-none
                      focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${errors.email ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-error text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.email}
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="
                  relative w-full h-11 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-primary to-primary/80
                  text-white border border-primary/50
                  shadow-lg shadow-primary/25
                  transition-all duration-200
                  hover:shadow-xl hover:shadow-primary/35 hover:from-primary hover:to-primary
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </motion.button>
              
              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {/* Reset Token */}
              <div className="space-y-1.5">
                <label htmlFor="token" className="block text-sm font-medium text-text-secondary">
                  Verification Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => { setToken(e.target.value); setErrors(p => ({ ...p, token: undefined })); }}
                    placeholder="Enter reset token"
                    disabled={isLoading}
                    className={`
                      w-full h-11 pl-10 pr-4 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                      bg-white/5 border transition-all outline-none
                      focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${errors.token ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                    `}
                  />
                </div>
                {errors.token && (
                  <p className="text-error text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.token}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    disabled={isLoading}
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
                {errors.password && (
                  <p className="text-error text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`
                      w-full h-11 pl-10 pr-12 rounded-xl text-sm text-text-primary placeholder:text-text-muted
                      bg-white/5 border transition-all outline-none
                      focus:bg-white/8 focus:border-primary/60 focus:ring-2 focus:ring-primary/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${errors.confirmPassword ? 'border-error/60 bg-error/5' : 'border-white/10 hover:border-white/20'}
                    `}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-error text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="
                  relative w-full h-11 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-primary to-primary/80
                  text-white border border-primary/50
                  shadow-lg shadow-primary/25
                  transition-all duration-200
                  hover:shadow-xl hover:shadow-primary/35 hover:from-primary hover:to-primary
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting password…
                  </>
                ) : (
                  'Reset Password'
                )}
              </motion.button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Email request
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-5 py-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 border border-success/30 text-success"
              >
                <CheckCircle className="w-9 h-9" />
              </motion.div>
              <h2 className="text-xl font-semibold text-text-primary">Password Reset Complete!</h2>
              <p className="text-sm text-text-secondary">
                Your password has been updated. You will be redirected to the sign-in page in a few seconds...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-10 px-6 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          )}

        </div>

        {/* Bottom tag */}
        <p className="mt-4 text-center text-xs text-text-muted">
          Protected by JWT authentication · 256-bit encryption
        </p>
      </motion.div>
    </div>
  );
}
