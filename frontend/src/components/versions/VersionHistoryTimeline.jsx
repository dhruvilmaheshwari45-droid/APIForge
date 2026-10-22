import React, { useState, useMemo } from 'react';
import { 
  History, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  GitBranch, 
  Search, 
  Filter, 
  CheckCircle2,
  Layers
} from 'lucide-react';
import { VersionStatusBadge } from './VersionCard';

export const VersionHistoryTimeline = ({ changelog = [] }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredHistory = useMemo(() => {
    let list = changelog;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.description.toLowerCase().includes(q) ||
          c.versionNumber.toLowerCase().includes(q) ||
          (c.tag && c.tag.toLowerCase().includes(q))
      );
    }

    if (filterType === 'breaking') {
      list = list.filter((c) => c.breaking);
    } else if (filterType !== 'ALL') {
      list = list.filter((c) => c.type === filterType);
    }

    return list;
  }, [changelog, filterType, search]);

  const getTypeStyle = (type, breaking) => {
    if (breaking) {
      return {
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: AlertTriangle,
        iconColor: 'text-rose-500',
        dot: 'bg-rose-500',
      };
    }

    switch (type) {
      case 'added':
        return {
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: Plus,
          iconColor: 'text-emerald-500',
          dot: 'bg-emerald-500',
        };
      case 'removed':
        return {
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          icon: Trash2,
          iconColor: 'text-rose-500',
          dot: 'bg-rose-500',
        };
      case 'deprecated':
        return {
          badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          dot: 'bg-orange-500',
        };
      case 'changed':
      default:
        return {
          badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          icon: Sparkles,
          iconColor: 'text-cyan-500',
          dot: 'bg-cyan-500',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 px-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search change history log..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Change Type Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
          {[
            { id: 'ALL', label: 'All History' },
            { id: 'breaking', label: 'Breaking Changes' },
            { id: 'added', label: 'Added' },
            { id: 'changed', label: 'Changed' },
            { id: 'deprecated', label: 'Deprecated' },
            { id: 'removed', label: 'Removed' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterType === item.id
                  ? 'bg-brand-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      {filteredHistory.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {filteredHistory.map((entry) => {
            const style = getTypeStyle(entry.type, entry.breaking);
            const IconComponent = style.icon;

            return (
              <div key={entry.id} className="relative group">
                {/* Timeline Bullet */}
                <div className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${style.dot} shadow-sm`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950" />
                </div>

                {/* Timeline Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-sm transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        {entry.versionNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${style.badge} flex items-center space-x-1`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{entry.tag || entry.type.toUpperCase()}</span>
                      </span>
                      {entry.breaking && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white uppercase tracking-wider">
                          Breaking
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {entry.date}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
                    {entry.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-xs font-mono text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No change records matched the active filter.
        </div>
      )}
    </div>
  );
};

export default VersionHistoryTimeline;
