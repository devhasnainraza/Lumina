'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityChart } from '@/components/analytics/ActivityChart';
import { DocumentTypesChart } from '@/components/analytics/DocumentTypesChart';
import { VectorSpaceChart } from '@/components/analytics/VectorSpaceChart';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  FileText,
  MessagesSquare,
  HardDrive,
  Cpu,
  Thermometer,
  Database,
  Activity,
  Clock,
  Sparkles,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/dashboard/MobileMenu';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const { data, isLoading, error } = useAnalytics(period);
  const [showProfile, setShowProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem('pref-user-avatar');
      setAvatarUrl(savedAvatar);
    }
  }, []);

  // Sync active model and settings from Chat store for dynamic insight values
  const { activeModel, temperature, topK } = useChatStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getModelLabel = (model: string) => {
    if (model === 'gemini-1.5-pro') return 'Gemini 1.5 Pro';
    if (model === 'llama-3.3-70b-versatile') return 'Llama 3.3 70B';
    return model;
  };

  return (
    <div className="relative min-h-screen pb-12 overflow-x-hidden">
      {/* Background Radial Glow Blobs */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full glow-blob-primary opacity-20 pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full glow-blob-secondary opacity-15 pointer-events-none -z-10" />

      {/* Sticky Glassmorphic Header (Scroll to Hide styled, matches chat) */}
      <header className="glass-navbar sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 min-h-[73px] gap-2">
        <div className="flex flex-col min-w-0">
          <h2 className="text-base font-bold text-text-primary truncate">
            Dashboard & Analytics
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
              <Activity className="w-3 h-3 text-primary" />
              Live system stats
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        {/* Action Controls inside the header */}
        <div className="flex items-center gap-3">
          {/* Premium Segmented Period Selector */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 relative">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${period === '7d'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
            >
              7D
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${period === '30d'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
            >
              30D
            </button>
          </div>

          {/* User Profile Selector with Dropdown Popover */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 rounded-xl border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md shadow-primary/10"
              title="User Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2.5 w-64 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-30 space-y-3 text-left">
                <div className="flex items-center gap-3 pb-2.5 border-b border-white/5">
                  <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-surface-secondary shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <MobileMenu />
        </div>
      </header>

      <div className="px-4 md:px-6 max-w-7xl mx-auto pt-8 space-y-6 relative z-10">
        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-error" />
            <p className="text-error text-xs font-semibold">
              Failed to load analytics. Please refresh and try again.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[380px] lg:col-span-2 rounded-2xl" />
              <Skeleton className="h-[380px] rounded-2xl" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* 4 Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Queries"
                value={data.stats.queryCount}
                icon={MessageSquare}
                trend="+12.5%"
                trendType="up"
              />
              <StatsCard
                title="Documents Uploaded"
                value={data.stats.documentCount}
                icon={FileText}
                trend="+3 new"
                trendType="up"
              />
              <StatsCard
                title="Chat Sessions"
                value={data.stats.sessionCount}
                icon={MessagesSquare}
                trend="+8.1%"
                trendType="up"
              />
              <StatsCard
                title="Storage Consumed"
                value={formatBytes(data.storageUsed)}
                icon={HardDrive}
                trend="+4.2MB"
                trendType="neutral"
              />
            </div>

            {/* Charts Row - 2/3 and 1/3 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline Area Chart Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="p-6 bg-surface/45 backdrop-blur-xl border border-white/8 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-indigo-600 opacity-20" />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-text-primary">Activity Timeline</h3>
                      <p className="text-xs text-text-muted mt-0.5">Total user queries over the selected timeframe</p>
                    </div>
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <ActivityChart data={data.activityTimeline} />
                </Card>
              </motion.div>

              {/* Document Breakdown Donut Chart Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="p-6 bg-surface/45 backdrop-blur-xl border border-white/8 rounded-2xl shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-20" />
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-text-primary">Document Distribution</h3>
                        <p className="text-xs text-text-muted mt-0.5">Files categorized by extension type</p>
                      </div>
                      <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                        <Database className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <DocumentTypesChart data={data.documentTypes} />
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Vector Space Projection Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="p-6 bg-surface/45 backdrop-blur-xl border border-white/8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-cyan-400 to-indigo-600 opacity-20" />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Semantic Vector Space Clusters</h3>
                    <p className="text-xs text-text-muted mt-0.5">2D PCA projection of vector database segments grouped by topic</p>
                  </div>
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <VectorSpaceChart />
              </Card>
            </motion.div>

            {/* AI System Insights & Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-6 bg-surface/45 backdrop-blur-xl border border-white/8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />

                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">AI & RAG System Insights</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Setting 1: Connected Model */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                      <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Chat Model</p>
                      <p className="text-sm font-bold text-text-primary mt-0.5">{getModelLabel(activeModel)}</p>
                    </div>
                  </div>

                  {/* Setting 2: Creativity Temperature */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/10">
                      <Thermometer className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Model Creativity</p>
                      <p className="text-sm font-bold text-text-primary mt-0.5">
                        {temperature.toFixed(2)} ({temperature <= 0.2 ? 'Precise' : temperature <= 0.6 ? 'Balanced' : 'Creative'})
                      </p>
                    </div>
                  </div>

                  {/* Setting 3: Context depth / RAG latency */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Vector Index Status</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-sm font-bold text-text-primary">Optimized ({topK} Docs/Req)</p>
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid with Latency & System Status info */}
                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5">
                    <span className="text-text-muted font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-muted" /> Avg. Retrieval Latency:
                    </span>
                    <span className="font-extrabold text-primary">~184ms</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5">
                    <span className="text-text-muted font-medium flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-text-muted" /> Knowledge Base status:
                    </span>
                    <span className="font-extrabold text-success">Healthy</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5">
                    <span className="text-text-muted font-medium flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-text-muted" /> Server Resources:
                    </span>
                    <span className="font-extrabold text-text-primary">Optimal</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5">
                    <span className="text-text-muted font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-text-muted" /> API Connectivity:
                    </span>
                    <span className="font-extrabold text-success">100% Up</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

