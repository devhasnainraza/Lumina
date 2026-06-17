'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VectorPoint {
  x: number;
  y: number;
  z: number; // size
  name: string;
  category: string;
  snippet: string;
}

const mockVectorData: VectorPoint[] = [
  // Cluster 1: Finance (Purple)
  { x: 2.5, y: 3.0, z: 10, name: "Quarterly_Report.pdf", category: "Finance", snippet: "Q3 net margins expanded by 4.2% driven by scaling cloud optimization services." },
  { x: 3.1, y: 2.8, z: 12, name: "Quarterly_Report.pdf", category: "Finance", snippet: "Total operating expenses recorded at $1.2M, matching the fiscal guidance targets." },
  { x: 2.0, y: 3.5, z: 8, name: "Tax_Doc_2025.txt", category: "Finance", snippet: "Amortization schedule deductions for intangible software capital assets." },
  
  // Cluster 2: Legal / Operations (Teal)
  { x: -4.2, y: -2.1, z: 15, name: "Terms_Of_Service.docx", category: "Legal", snippet: "Indemnification clauses protect licensees from third-party intellectual property claims." },
  { x: -3.8, y: -3.0, z: 10, name: "Terms_Of_Service.docx", category: "Legal", snippet: "Severability of contract terms if any provision is declared invalid by court authority." },
  { x: -4.5, y: -1.5, z: 9, name: "NDA_Template.pdf", category: "Legal", snippet: "Recipient agrees to restrict access to proprietary information to authorized employees." },
  
  // Cluster 3: Technology / Architecture (Cyan)
  { x: -1.5, y: 4.2, z: 14, name: "System_Architecture.pdf", category: "Engineering", snippet: "PostgreSQL holds database structures, while ChromaDB functions as the vector space index." },
  { x: -0.8, y: 3.9, z: 11, name: "System_Architecture.pdf", category: "Engineering", snippet: "FastAPI handles client authentication, utilizing JWT signature tokens on ingress." },
  { x: -2.0, y: 4.8, z: 10, name: "Docker_Deploy_Guide.txt", category: "Engineering", snippet: "Docker compose aggregates local networks, mapping health checks to port 8001 endpoints." },
  
  // Cluster 4: General (Orange)
  { x: 4.5, y: -3.2, z: 9, name: "Project_Outline.txt", category: "General", snippet: "Lumina chatbot platform delivers research workflows for semantic documentation discovery." },
  { x: 3.9, y: -4.0, z: 11, name: "Meeting_Notes.docx", category: "General", snippet: "Action items align frontend visual enhancements and premium responsive layout scaling." }
];

const COLORS: { [key: string]: string } = {
  Finance: '#7C3AED',   // Purple
  Legal: '#06B6D4',     // Cyan
  Engineering: '#10B981', // Emerald
  General: '#F59E0B'    // Amber
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: VectorPoint = payload[0].payload;
    return (
      <div className="bg-surface/90 backdrop-blur-xl border border-white/8 p-3.5 rounded-xl shadow-2xl max-w-xs relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex justify-between items-center gap-2 mb-1.5 relative z-10">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-text-muted truncate max-w-[150px]">
            {data.name}
          </span>
          <span 
            className="text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-sm"
            style={{ 
              backgroundColor: `${COLORS[data.category]}15`, 
              color: COLORS[data.category], 
              border: `1px solid ${COLORS[data.category]}30` 
            }}
          >
            {data.category}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-text-primary mb-2 select-all font-medium relative z-10">
          "{data.snippet}"
        </p>
        <div className="text-[9px] font-bold text-text-muted flex gap-3 relative z-10 border-t border-white/5 pt-1.5">
          <span>X: {data.x.toFixed(2)}</span>
          <span>Y: {data.y.toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function VectorSpaceChart() {
  return (
    <div className="w-full h-[320px]">
      <div className="flex justify-end gap-4 mb-2 flex-wrap text-[9px] font-bold text-text-muted uppercase tracking-wider select-none">
        {Object.entries(COLORS).map(([cat, col]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
            <span>{cat}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="X Coordinate" 
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Y Coordinate" 
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 200]} name="Weight" />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.08)' }} />
          <Scatter name="Chunks" data={mockVectorData}>
            {mockVectorData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.category]} 
                stroke="#0B1020" 
                strokeWidth={1.5}
                style={{ filter: `drop-shadow(0 0 6px ${COLORS[entry.category]}40)` }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
