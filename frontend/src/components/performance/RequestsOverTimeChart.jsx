import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const RequestsOverTimeChart = ({ data = [] }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No request volume telemetry available.
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
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="reqThroughputGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="failedReqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>

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
            formatter={(value, name) => [`${value.toLocaleString()} calls`, name]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
          />

          <Area
            type="monotone"
            dataKey="requests"
            name="Total Requests"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#reqThroughputGrad)"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed Calls"
            stroke="#f43f5e"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#failedReqGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RequestsOverTimeChart;
