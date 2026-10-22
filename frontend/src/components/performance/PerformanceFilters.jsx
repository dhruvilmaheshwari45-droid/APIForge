import React from 'react';
import { 
  Filter, 
  Globe, 
  Code2, 
  Calendar, 
  RotateCcw, 
  Search,
  Activity
} from 'lucide-react';

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'DELETE'];

export const PerformanceFilters = ({
  filters,
  options,
  onChange,
  onReset,
}) => {
  const {
    environment = 'ALL',
    endpoint = 'ALL',
    method = 'ALL',
    timeRange = '24h',
  } = filters;

  const isFiltered =
    environment !== 'ALL' ||
    endpoint !== 'ALL' ||
    method !== 'ALL' ||
    timeRange !== '24h';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Dropdowns for Environment, Endpoint, Time Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Environment Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Env:</span>
            <select
              value={environment}
              onChange={(e) => onChange({ environment: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              {options?.environments?.map((env) => (
                <option key={env} value={env} className="bg-white dark:bg-slate-900">
                  {env === 'ALL' ? 'All Environments' : env}
                </option>
              ))}
            </select>
          </div>

          {/* Endpoint Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Endpoint:</span>
            <select
              value={endpoint}
              onChange={(e) => onChange({ endpoint: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {options?.endpoints?.map((ep) => (
                <option key={ep} value={ep} className="bg-white dark:bg-slate-900">
                  {ep === 'ALL' ? 'All Endpoints' : ep}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Range:</span>
            <select
              value={timeRange}
              onChange={(e) => onChange({ timeRange: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              {options?.timeRanges?.map((tr) => (
                <option key={tr.value} value={tr.value} className="bg-white dark:bg-slate-900">
                  {tr.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: HTTP Method Pills & Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* Method Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {HTTP_METHODS.map((m) => {
              const isSelected = method === m;
              return (
                <button
                  key={m}
                  onClick={() => onChange({ method: m })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs font-mono font-medium flex items-center space-x-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceFilters;
