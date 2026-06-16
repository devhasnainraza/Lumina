'use client';

import { Card } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

export function StatsCard({ title, value, icon: Icon, trend, trendType = 'up' }: StatsCardProps) {
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <Card className="relative overflow-hidden p-6 bg-surface/45 backdrop-blur-xl border border-white/8 hover:border-primary/45 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.15)] group">
        {/* Glow border overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</p>
            <p className="text-3xl font-extrabold tracking-tight text-text-primary bg-gradient-to-r from-white to-text-secondary bg-clip-text">
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                  isUp 
                    ? 'text-success bg-success/10 border border-success/10' 
                    : isDown 
                      ? 'text-error bg-error/10 border border-error/10' 
                      : 'text-text-muted bg-white/5 border border-white/5'
                }`}>
                  {isUp && <TrendingUp className="w-3 h-3" />}
                  {isDown && <TrendingDown className="w-3 h-3" />}
                  {trend}
                </span>
                <span className="text-[10px] text-text-muted font-medium">vs last period</span>
              </div>
            )}
          </div>
          
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-indigo-600/5 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.1)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.35)] group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
            <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

