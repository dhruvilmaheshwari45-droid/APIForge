import React from 'react';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills', // 'pills' | 'underline'
  size = 'md',
  className = '',
}) => {
  const isPills = variant === 'pills';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2.5',
  };

  return (
    <div
      role="tablist"
      className={`
        flex items-center overflow-x-auto custom-scrollbar select-none
        ${isPills ? 'p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 space-x-1' : 'border-b border-slate-200 dark:border-slate-800 space-x-6'}
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (isPills) {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange?.(tab.id)}
              className={`
                flex items-center font-mono font-medium rounded-lg transition-all duration-150 shrink-0
                ${sizeClasses[size] || sizeClasses.md}
                ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 font-bold shadow-sm border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/60'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
              `}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        // Underline variant
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange?.(tab.id)}
            className={`
              flex items-center font-mono font-medium py-3 border-b-2 transition-all duration-150 shrink-0 -mb-px
              ${sizeClasses[size] || sizeClasses.md}
              ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
            `}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
