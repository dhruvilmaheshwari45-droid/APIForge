import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs = [],
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4 ${className}`}
    >
      <div>
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mb-2">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.path || idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {isLast || !crumb.path ? (
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-sans max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center space-x-2.5 shrink-0 self-start sm:self-auto flex-wrap gap-y-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
