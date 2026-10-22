import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';

export const TestStatsChart = ({ data = [] }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No test execution statistics available.
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
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
          <XAxis
            dataKey="suite"
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            dy={5}
            fontFamily="JetBrains Mono, monospace"
            interval={0}
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
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Bar dataKey="passed" name="Passed Assertions" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" name="Failed Assertions" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TestStatsChart;
