'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ActivityDataPoint } from '@/types/document';

interface ActivityChartProps {
  data: ActivityDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-white/8 p-3.5 rounded-xl shadow-2xl relative overflow-hidden">
        {/* subtle gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 relative z-10">
          {new Date(label).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <p className="text-sm font-extrabold text-primary flex items-center gap-1.5 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {payload[0].value} {payload[0].value === 1 ? 'query' : 'queries'}
        </p>
      </div>
    );
  }
  return null;
};

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            dy={8}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            dx={-8}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124, 58, 237, 0.15)', strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#7C3AED"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#activityGradient)"
            dot={{ fill: '#0B1020', stroke: '#7C3AED', strokeWidth: 2, r: 4 }}
            activeDot={{ fill: '#7C3AED', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

