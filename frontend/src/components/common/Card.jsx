import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  variant = 'default', // 'default' | 'elevated' | 'ghost' | 'flat'
  onClick,
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm',
    elevated:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750 text-slate-900 dark:text-slate-100 shadow-md dark:shadow-slate-950/40',
    flat:
      'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100',
    ghost:
      'bg-transparent border border-transparent text-slate-900 dark:text-slate-100',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl overflow-hidden transition-all duration-150
        ${variantStyles[variant] || variantStyles.default}
        ${
          hoverable
            ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div
    className={`p-5 pb-3 flex items-start justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', as = 'h3', ...props }) => {
  const Component = as;
  return (
    <Component
      className={`text-sm font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => (
  <p
    className={`text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5 leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-5 pt-2 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`p-4 px-5 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
