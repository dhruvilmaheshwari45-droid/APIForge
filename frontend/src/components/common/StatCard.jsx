import React from 'react';

export const StatCard = ({ title, value, change, changeType = 'positive', icon: Icon, description }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-brand-600 dark:text-brand-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-50">{value}</span>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            changeType === 'positive' 
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' 
              : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
          }`}>
            {change}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
      )}
    </div>
  );
};

export default StatCard;
