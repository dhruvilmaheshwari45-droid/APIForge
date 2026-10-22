import React, { useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Layers, 
  Clock 
} from 'lucide-react';
import TrafficOverviewChart from '../charts/TrafficOverviewChart';
import StatusCodeChart from '../charts/StatusCodeChart';
import { MethodBadge, StatusBadge } from '../common/Badge';

export const TrafficChartsPanel = ({ metrics, onRequestClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!metrics) return null;

  const {
    requestsOverTime = [],
    statusCodeDistribution = [],
    methodDistribution = [],
    recentErrors = [],
  } = metrics;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all">
      {/* Header with Collapse Toggle */}
      <div className="p-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
            Visual Traffic Analytics & Status Telemetry
          </h3>
          <span className="text-xs font-mono text-slate-400">
            (Filtered Window)
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          title={isCollapsed ? 'Expand Charts' : 'Collapse Charts'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-5 space-y-5">
          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Requests & Errors Over Time */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Requests Volume Over Time
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Hourly throughput frequency with failed response overlay
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 text-brand-500">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    Requests
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Errors
                  </span>
                </div>
              </div>
              <TrafficOverviewChart data={requestsOverTime} />
            </div>

            {/* Chart 2: Status Code Distribution */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    HTTP Status Code Distribution
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Breakdown of returned response status codes
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {statusCodeDistribution.length} distinct code{statusCodeDistribution.length === 1 ? '' : 's'}
                </span>
              </div>
              <StatusCodeChart data={statusCodeDistribution} />
            </div>
          </div>

          {/* Lower Row: HTTP Methods Breakdown & Recent Errors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
            {/* HTTP Method Frequency Breakdown */}
            <div className="lg:col-span-1 p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-500" />
                HTTP Method Breakdown
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {methodDistribution.length > 0 ? (
                  methodDistribution.map((item) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MethodBadge method={item.method} size="xs" />
                        <span className="text-slate-600 dark:text-slate-400">{item.count} calls</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.percent}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No method data recorded</p>
                )}
              </div>
            </div>

            {/* Recent Error Incidents Breakdown */}
            <div className="lg:col-span-2 p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Recent Error Incidents
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {recentErrors.length} captured
                </span>
              </div>

              {recentErrors.length > 0 ? (
                <div className="space-y-2">
                  {recentErrors.map((err) => (
                    <div
                      key={err.id}
                      onClick={() => onRequestClick && onRequestClick(err.id)}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 cursor-pointer transition-colors flex items-center justify-between text-xs font-mono group"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden pr-2">
                        <StatusBadge status={err.status} />
                        <MethodBadge method={err.method} size="xs" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-500 transition-colors">
                          {err.path}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0 text-[11px] text-slate-400">
                        <span className="text-rose-500 truncate max-w-[140px] sm:max-w-[200px]" title={err.errorMessage}>
                          {err.errorMessage}
                        </span>
                        <span>{err.responseTimeMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                  <span>Zero errors detected in the current filter scope. System operating cleanly!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficChartsPanel;
