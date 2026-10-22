import React from 'react';
import { 
  GitBranch, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Layers, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const VersionStatusBadge = ({ status }) => {
  const normalized = (status || 'Draft').toLowerCase();

  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
  let dotColor = 'bg-slate-400';

  if (normalized === 'active') {
    styles = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'draft') {
    styles = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'deprecated') {
    styles = 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'archived') {
    styles = 'bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    dotColor = 'bg-slate-500';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};

export const VersionCard = ({
  version,
  onInspect,
  onEdit,
  onDelete,
  onCompare,
  onSetActive,
}) => {
  const isDefault = Boolean(version.isDefault || version.status === 'Active');
  const endpointCount = version.endpoints ? version.endpoints.length : 0;
  const changelogCount = version.changelog ? version.changelog.length : 0;

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? isoString : d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
      isDefault 
        ? 'border-brand-500/50 dark:border-brand-500/50 ring-1 ring-brand-500/20' 
        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 font-mono text-lg">
                  {version.versionNumber}
                </h3>
                <VersionStatusBadge status={version.status} />
                {isDefault && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    CURRENT
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Released: {version.releaseDate || 'Unreleased'}
              </span>
            </div>
          </div>

          {/* Quick breaking change pill */}
          {version.breakingChanges && (
            <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[11px] font-mono font-semibold flex items-center space-x-1 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Breaking</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {version.description || 'No version description provided.'}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span>{endpointCount} Endpoint{endpointCount === 1 ? '' : 's'}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Mod: {formatDate(version.lastModified)}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onInspect(version)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-colors"
            title="Inspect version details and endpoints"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <button
            onClick={() => onCompare(version.id)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-300 text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-colors"
            title="Compare against another version"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {!isDefault && onSetActive && (
            <button
              onClick={() => onSetActive(version.id)}
              className="px-2 py-1.5 rounded-lg text-xs font-medium font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Promote to Active production version"
            >
              Make Active
            </button>
          )}

          <button
            onClick={() => onEdit(version)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit version metadata"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {!isDefault && (
            <button
              onClick={() => onDelete(version)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Delete version"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
