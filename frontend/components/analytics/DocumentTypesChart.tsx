'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DocumentTypeStats } from '@/types/document';

interface DocumentTypesChartProps {
  data: DocumentTypeStats;
}

const COLORS = {
  pdf: '#7C3AED',   // Violet
  docx: '#06B6D4',  // Cyan
  txt: '#10B981',   // Emerald
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-white/8 p-3 rounded-xl shadow-2xl relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5 relative z-10">
          Document Type
        </p>
        <p className="text-sm font-extrabold flex items-center gap-1.5 relative z-10" style={{ color: data.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
          {data.name}: {data.value} {data.value === 1 ? 'file' : 'files'}
        </p>
      </div>
    );
  }
  return null;
};

const RenderLegend = ({ payload }: any) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, index: number) => {
        const count = entry.payload?.value ?? 0;
        const color = entry.color ?? entry.payload?.color ?? '#7C3AED';
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{entry.value}</span>
            <span className="text-[10px] font-bold text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function DocumentTypesChart({ data }: DocumentTypesChartProps) {
  const chartData = [
    { name: 'PDF', value: data.pdf, color: COLORS.pdf },
    { name: 'DOCX', value: data.docx, color: COLORS.docx },
    { name: 'TXT', value: data.txt, color: COLORS.txt },
  ].filter(item => item.value > 0);

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
        <p className="text-sm text-text-muted font-medium mb-1">No documents uploaded yet</p>
        <p className="text-xs text-text-muted/60 max-w-xs">Upload PDF, DOCX, or TXT documents to get starting insights.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] flex flex-col justify-between">
      <div className="flex-1 relative min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={3}
              cornerRadius={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(11, 16, 32, 0.6)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {/* Embed Total Document Count in the Donut hole */}
            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-text-primary font-extrabold text-2xl tracking-tight">
              {total}
            </text>
            <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="fill-text-muted font-bold text-[9px] uppercase tracking-widest">
              Documents
            </text>
            <Legend content={<RenderLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


