import React from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Globe, 
  ArrowUpDown, 
  Activity, 
  Layers, 
  RotateCcw 
} from 'lucide-react';

const HTTP_METHODS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: '2xx', label: '2xx Success' },
  { value: '3xx', label: '3xx Redirect' },
  { value: '4xx', label: '4xx Client Err' },
  { value: '5xx', label: '5xx Server Err' },
];
const ENVIRONMENTS = [
  { value: 'ALL', label: 'All Environments' },
  { value: 'Development', label: 'Development' },
  { value: 'Staging', label: 'Staging' },
  { value: 'Production', label: 'Production' },
];
const TIME_RANGES = [
  { value: '1h', label: 'Last 1 Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'all', label: 'All Time' },
];
const SORT_OPTIONS = [
  { value: 'timestamp_desc', label: 'Newest First' },
  { value: 'timestamp_asc', label: 'Oldest First' },
  { value: 'latency_desc', label: 'Latency (High to Low)' },
  { value: 'latency_asc', label: 'Latency (Low to High)' },
  { value: 'status_desc', label: 'Status Code (High to Low)' },
];

export const TrafficFilters = ({
  filters,
  onChange,
  onReset,
  totalFilteredCount,
  totalRawCount,
}) => {
  const {
    search = '',
    method = 'ALL',
    status = 'ALL',
    environment = 'ALL',
    timeRange = '24h',
    source = 'ALL',
    sortBy = 'timestamp',
    sortOrder = 'desc',
  } = filters;

  const currentSortKey = `${sortBy === 'responseTimeMs' ? 'latency' : sortBy}_${sortOrder}`;

  const isFiltered =
    Boolean(search) ||
    method !== 'ALL' ||
    status !== 'ALL' ||
    environment !== 'ALL' ||
    timeRange !== '24h' ||
    source !== 'ALL' ||
    sortBy !== 'timestamp' ||
    sortOrder !== 'desc';

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'timestamp_desc') {
      onChange({ sortBy: 'timestamp', sortOrder: 'desc' });
    } else if (val === 'timestamp_asc') {
      onChange({ sortBy: 'timestamp', sortOrder: 'asc' });
    } else if (val === 'latency_desc') {
      onChange({ sortBy: 'responseTimeMs', sortOrder: 'desc' });
    } else if (val === 'latency_asc') {
      onChange({ sortBy: 'responseTimeMs', sortOrder: 'asc' });
    } else if (val === 'status_desc') {
      onChange({ sortBy: 'status', sortOrder: 'desc' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
      {/* Top Search & Method Buttons Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by endpoint path, URL, request ID, or client IP..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* HTTP Method Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
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
      </div>

      {/* Second Line: Select Dropdowns & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <span className="text-[11px] font-mono text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={environment}
              onChange={(e) => onChange({ environment: e.target.value })}
              className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {ENVIRONMENTS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => onChange({ timeRange: e.target.value })}
              className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {TIME_RANGES.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={source}
              onChange={(e) => onChange({ source: e.target.value })}
              className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">All Sources</option>
              <option value="real" className="bg-white dark:bg-slate-900">Real Client Executions</option>
              <option value="sample" className="bg-white dark:bg-slate-900">Demo Seed Stream</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentSortKey}
              onChange={handleSortChange}
              className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Info & Clear Filters */}
        <div className="flex items-center space-x-2.5">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{totalFilteredCount}</strong> of {totalRawCount}
          </span>
          {isFiltered && (
            <button
              onClick={onReset}
              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs font-mono font-medium flex items-center space-x-1 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficFilters;
