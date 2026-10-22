import React from 'react';
import { HTTP_METHODS, STATUS_COLORS } from '../../utils/constants';

const BADGE_VARIANTS = {
  primary:
    'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20 dark:border-brand-500/30',
  secondary:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30',
  warning:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',
  danger:
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30',
  info:
    'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20 dark:border-cyan-500/30',
  neutral:
    'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
};

const DOT_COLORS = {
  primary: 'bg-brand-500',
  secondary: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-cyan-500',
  neutral: 'bg-slate-400',
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium font-mono rounded-md border tracking-tight
        ${BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral}
        ${sizeClasses[size] || sizeClasses.sm}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
            DOT_COLORS[variant] || DOT_COLORS.neutral
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export const MethodBadge = ({ method, size = 'sm' }) => {
  const config = HTTP_METHODS[method?.toUpperCase()] || {
    label: method || 'GET',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-bold',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded font-mono font-semibold border
        ${config.color}
        ${sizeClasses[size] || sizeClasses.sm}
      `}
    >
      {config.label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  let color = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  if (typeof status === 'number') {
    color =
      STATUS_COLORS[status] ||
      (status < 300
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
        : status < 400
        ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20'
        : status < 500
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20');
  } else if (typeof status === 'string') {
    const s = status.toLowerCase();
    if (s === 'running' || s === 'passed' || s === 'active' || s === 'success' || s === 'stable / current') {
      color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    } else if (s === 'failed' || s === 'stopped' || s === 'error') {
      color = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
    } else if (s === 'beta' || s === 'warning' || s === 'deprecated') {
      color = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${color}`}
    >
      {status}
    </span>
  );
};

export default Badge;
