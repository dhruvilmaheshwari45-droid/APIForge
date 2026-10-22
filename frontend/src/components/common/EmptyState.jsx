import React from 'react';
import { FolderPlus } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = FolderPlus,
  title = 'No data available',
  description = 'Get started by creating your first entry.',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
  className = '',
  children,
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm
        ${compact ? 'p-6 my-2' : 'p-12 my-4'}
        ${className}
      `}
    >
      <div
        className={`bg-slate-100 dark:bg-slate-800/80 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center shadow-inner ${
          compact ? 'p-3 mb-3' : 'p-4 mb-4'
        }`}
      >
        <Icon className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
      </div>

      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5 font-sans leading-relaxed">
          {description}
        </p>
      )}

      {(actionText || secondaryActionText || children) && (
        <div className="flex items-center space-x-3">
          {secondaryActionText && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {actionText && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionText}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
