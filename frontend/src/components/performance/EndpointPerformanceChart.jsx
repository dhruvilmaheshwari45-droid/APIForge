import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const EndpointPerformanceChart = ({ data = [], onSelectEndpoint }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No endpoint benchmarks available for this selection.
      </div>
    );
  }

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  const getLatencyColor = (ms) => {
    if (ms < 200) return '#10b981'; // Green for fast
    if (ms < 400) return '#f59e0b'; // Amber for moderate
    return '#f43f5e'; // Rose for high latency
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 35, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} horizontal={false} />
          <XAxis
            type="number"
            stroke={axisColor}
            fontSize={11}
            unit="ms"
            fontFamily="JetBrains Mono, monospace"
          />
          <YAxis
            type="category"
            dataKey="endpoint"
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            width={110}
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
              `${value} ms (P95: ${item.payload.p95Ms}ms, P99: ${item.payload.p99Ms}ms)`,
              'Avg Latency'
            ]}
          />
          <Bar
            dataKey="avgLatencyMs"
            name="Avg Latency (ms)"
            radius={[0, 6, 6, 0]}
            onClick={(entry) => onSelectEndpoint && onSelectEndpoint(entry.endpoint)}
            className="cursor-pointer"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getLatencyColor(entry.avgLatencyMs)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EndpointPerformanceChart;
