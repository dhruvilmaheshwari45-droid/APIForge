import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  Search, 
  Check, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Filter, 
  Plus, 
  Minus, 
  RefreshCw,
  GitCompare
} from 'lucide-react';
import { MethodBadge } from '../common/Badge';
import { VersionStatusBadge } from './VersionCard';
import versionService from '../../services/versionService';

export const VersionComparisonView = ({ versions = [], initialVerA = null, initialVerB = null }) => {
  const versionIds = useMemo(() => versions.map((v) => v.id), [versions]);

  const [verAId, setVerAId] = useState(
    initialVerA || (versions[0]?.id || '')
  );
  const [verBId, setVerBId] = useState(
    initialVerB || (versions[1]?.id || versions[0]?.id || '')
  );

  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('ALL');

  // Compute diff comparison using service
  const comparison = useMemo(() => {
    if (!verAId || !verBId) return null;
    return versionService.compareVersions(verAId, verBId);
  }, [verAId, verBId, versions]);

  const handleSwap = () => {
    setVerAId(verBId);
    setVerBId(verAId);
  };

  const filteredEndpoints = useMemo(() => {
    if (!comparison || !comparison.endpoints) return [];
    let list = comparison.endpoints;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.path.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    if (diffFilter !== 'ALL') {
      list = list.filter((e) => e.diffType === diffFilter);
    }

    return list;
  }, [comparison, search, diffFilter]);

  if (!comparison) return null;

  const { versionA, versionB, summary } = comparison;

  return (
    <div className="space-y-5">
      {/* Top Comparison Controls Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-violet-500" />
              API Schema & Endpoint Diff Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Select two versions to inspect endpoint availability, breaking changes, and structural differences.
            </p>
          </div>
        </div>

        {/* Version Pickers with Swap Button */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          {/* Base Version A */}
          <div className="md:col-span-5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Base Version (vA)
            </span>
            <div className="flex items-center gap-2">
              <select
                value={verAId}
                onChange={(e) => setVerAId(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionNumber} ({v.endpoints?.length || 0} routes) - {v.status}
                  </option>
                ))}
              </select>
              <VersionStatusBadge status={versionA.status} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
              {versionA.description}
            </p>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={handleSwap}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-brand-500 shadow-sm transition-colors"
              title="Swap Base and Target Versions"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Target Version B */}
          <div className="md:col-span-5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Target Version (vB)
            </span>
            <div className="flex items-center gap-2">
              <select
                value={verBId}
                onChange={(e) => setVerBId(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionNumber} ({v.endpoints?.length || 0} routes) - {v.status}
                  </option>
                ))}
              </select>
              <VersionStatusBadge status={versionB.status} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-sans">
              {versionB.description}
            </p>
          </div>
        </div>

        {/* Diff KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[11px] block">{versionA.versionNumber} Total</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {summary.totalEndpointsA} routes
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[11px] block">{versionB.versionNumber} Total</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {summary.totalEndpointsB} routes
            </span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg">
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] block">Added in {versionB.versionNumber}</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              +{summary.addedCount} new
            </span>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg">
            <span className="text-rose-600 dark:text-rose-400 text-[11px] block">Removed in {versionB.versionNumber}</span>
            <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
              -{summary.removedCount} deleted
            </span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg">
            <span className="text-amber-600 dark:text-amber-400 text-[11px] block">Modified</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
              {summary.modifiedCount} schema diffs
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[11px] block">Unchanged</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {summary.unchangedCount} identical
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search endpoints (e.g., /users, /orders)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Diff Category Filter */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
          {[
            { id: 'ALL', label: `All (${comparison.endpoints.length})` },
            { id: 'added', label: `Added (+${summary.addedCount})` },
            { id: 'removed', label: `Removed (-${summary.removedCount})` },
            { id: 'modified', label: `Modified (${summary.modifiedCount})` },
            { id: 'unchanged', label: `Unchanged (${summary.unchangedCount})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDiffFilter(item.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                diffFilter === item.id
                  ? 'bg-brand-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 px-4 font-semibold w-2/5">Endpoint Route</th>
                <th className="p-3 font-semibold text-center w-1/5">{versionA.versionNumber}</th>
                <th className="p-3 font-semibold text-center w-1/5">{versionB.versionNumber}</th>
                <th className="p-3 px-4 font-semibold text-right w-1/5">Diff Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {filteredEndpoints.length > 0 ? (
                filteredEndpoints.map((ep) => {
                  let rowBadge = null;

                  if (ep.diffType === 'added') {
                    rowBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">
                        <Plus className="w-3 h-3 text-emerald-500" />
                        Added in {versionB.versionNumber}
                      </span>
                    );
                  } else if (ep.diffType === 'removed') {
                    rowBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px]">
                        <Minus className="w-3 h-3 text-rose-500" />
                        Removed in {versionB.versionNumber}
                      </span>
                    );
                  } else if (ep.diffType === 'modified') {
                    rowBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px]">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Modified Schema
                      </span>
                    );
                  } else {
                    rowBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px]">
                        <Check className="w-3 h-3 text-slate-400" />
                        Unchanged
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={ep.key}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Endpoint & Method */}
                      <td className="p-3 px-4">
                        <div className="flex items-center space-x-2">
                          <MethodBadge method={ep.method} size="xs" />
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {ep.path}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-sans block mt-1">
                          {ep.description}
                        </span>
                      </td>

                      {/* Version A Presence */}
                      <td className="p-3 text-center">
                        {ep.existsInA ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Available</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 border border-slate-200 dark:border-slate-700/60 text-xs">
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Not in {versionA.versionNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Version B Presence */}
                      <td className="p-3 text-center">
                        {ep.existsInB ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Available</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold">
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span>Removed</span>
                          </div>
                        )}
                      </td>

                      {/* Diff Status */}
                      <td className="p-3 px-4 text-right">
                        {rowBadge}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs font-mono text-slate-400">
                    No endpoint comparisons matched the search or diff filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VersionComparisonView;
