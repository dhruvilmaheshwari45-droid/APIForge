
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
  primary:
    'bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-sm shadow-brand-600/20 border border-brand-500/30 focus-visible:ring-brand-500',
  secondary:
    'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400',
  outline:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-600/20 border border-rose-500/30 focus-visible:ring-rose-500',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 border border-emerald-500/30 focus-visible:ring-emerald-500',
};

const SIZES = {
  xs: 'px-2 py-1 text-[11px] rounded-md gap-1 font-mono',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-xs font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm font-medium rounded-lg gap-2.5',
};

// Supports both JSX elements and component types.
const renderIcon = (icon, className) => {
  if (!icon) return null;

  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, {
      className: [icon.props.className, className]
        .filter(Boolean)
        .join(' '),
    });
  }

  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && icon.$$typeof)
  ) {
    return React.createElement(icon, { className });
  }

  return null;
};

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={`
          inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950
          ${VARIANTS[variant] || VARIANTS.primary}
          ${SIZES[size] || SIZES.md}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={size === 'lg' ? 'sm' : 'xs'}
            color={
              variant === 'primary' ||
              variant === 'danger' ||
              variant === 'success'
                ? 'white'
                : 'brand'
            }
          />
        )}

        {!loading &&
          renderIcon(leftIcon, 'w-3.5 h-3.5 shrink-0')}

        <span>{children}</span>

        {!loading &&
          renderIcon(rightIcon, 'w-3.5 h-3.5 shrink-0')}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
