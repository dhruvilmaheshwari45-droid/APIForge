import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';

export const LatencyTrendChart = ({ data = [] }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No latency telemetry available for this time range.
      </div>
    );
  }

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
          <XAxis
            dataKey="time"
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            dy={5}
            fontFamily="JetBrains Mono, monospace"
          />
          <YAxis
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            dx={-5}
            unit="ms"
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
            formatter={(value) => [`${value} ms`]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
          />

          <Line
            type="monotone"
            dataKey="avgMs"
            name="Avg Latency"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#06b6d4' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="p95Ms"
            name="P95 Latency"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2.5, fill: '#f59e0b' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LatencyTrendChart;
