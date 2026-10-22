import React from 'react';
import { Loader2 } from 'lucide-react';

const SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const COLORS = {
  brand: 'text-brand-500',
  white: 'text-white',
  slate: 'text-slate-400',
  emerald: 'text-emerald-500',
};

export const LoadingSpinner = ({
  size = 'md',
  color = 'brand',
  className = '',
  label,
  fullScreen = false,
}) => {
  const spinner = (
    <div className={`flex flex-col items-center justify-center space-y-2.5 ${className}`}>
      <Loader2
        className={`animate-spin ${SIZES[size] || SIZES.md} ${COLORS[color] || COLORS.brand}`}
      />
      {label && (
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
