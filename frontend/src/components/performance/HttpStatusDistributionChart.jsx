import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const HttpStatusDistributionChart = ({ data = [] }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No HTTP status distribution telemetry available.
      </div>
    );
  }

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
          <XAxis
            dataKey="code"
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          />
          <YAxis
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            dx={-5}
            fontFamily="JetBrains Mono, monospace"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '0.75rem',
              color: tooltipText,
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
            formatter={(value, name, item) => [
              `${value.toLocaleString()} requests (${item.payload.percent})`,
              'Count'
            ]}
          />
          <Bar dataKey="count" name="Total Requests" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HttpStatusDistributionChart;
