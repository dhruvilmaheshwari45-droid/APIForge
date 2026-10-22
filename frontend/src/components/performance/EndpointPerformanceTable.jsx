import React from 'react';
import { MethodBadge, Badge } from '../common/Badge';
import { Activity, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const EndpointPerformanceTable = ({ endpoints = [], onFilterByEndpoint }) => {
  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        No endpoint benchmarks match the active filter criteria.
      </div>
    );
  }

  const getLatencyTier = (ms) => {
    if (ms < 200) {
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      };
    }
    if (ms < 400) {
      return {
        text: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
      };
    }
    return {
      text: 'text-rose-600 dark:text-rose-400',
      bar: 'bg-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
    };
  };

  const getHealthBadge = (health) => {
    switch (health) {
      case 'optimal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Optimal
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Moderate
          </span>
        );
      case 'degraded':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Degraded
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3 px-4 font-semibold">Endpoint Route</th>
            <th className="p-3 font-semibold">Method</th>
            <th className="p-3 font-semibold">Avg Latency</th>
            <th className="p-3 font-semibold">P95 Latency</th>
            <th className="p-3 font-semibold">P99 Latency</th>
            <th className="p-3 font-semibold">Throughput</th>
            <th className="p-3 font-semibold">Error Rate</th>
            <th className="p-3 font-semibold">Health Status</th>
            <th className="p-3 px-4 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
          {endpoints.map((ep) => {
            const tier = getLatencyTier(ep.avgLatencyMs);
            const maxBarWidth = Math.min(100, Math.round((ep.avgLatencyMs / 600) * 100));

            return (
              <tr
                key={`${ep.endpoint}-${ep.method}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Endpoint & Category */}
                <td className="p-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                    <span>{ep.endpoint}</span>
                  </div>
                  {ep.category && (
                    <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                      {ep.category}
                    </span>
                  )}
                </td>

                {/* Method */}
                <td className="p-3">
                  <MethodBadge method={ep.method} size="xs" />
                </td>

                {/* Avg Latency with bar */}
                <td className="p-3">
                  <div className="space-y-1">
                    <span className={`font-bold ${tier.text}`}>
                      {ep.avgLatencyMs} ms
                    </span>
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier.bar}`}
                        style={{ width: `${maxBarWidth}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* P95 Latency */}
                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {ep.p95Ms} ms
                </td>

                {/* P99 Latency */}
                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {ep.p99Ms} ms
                </td>

                {/* Throughput */}
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ep.rpm} RPM
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {ep.requests.toLocaleString()} calls
                  </span>
                </td>

                {/* Error Rate */}
                <td className="p-3">
                  <span
                    className={`font-semibold ${
                      ep.errorRate > 4.0
                        ? 'text-rose-600 dark:text-rose-400'
                        : ep.errorRate > 2.0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {ep.errorRate}%
                  </span>
                </td>

                {/* Health Badge */}
                <td className="p-3">
                  {getHealthBadge(ep.health)}
                </td>

                {/* Filter Action */}
                <td className="p-3 px-4 text-right">
                  <button
                    onClick={() => onFilterByEndpoint && onFilterByEndpoint(ep.endpoint)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center space-x-1 transition-colors"
                    title={`Isolate ${ep.endpoint} in analytics`}
                  >
                    <span>Filter</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EndpointPerformanceTable;
