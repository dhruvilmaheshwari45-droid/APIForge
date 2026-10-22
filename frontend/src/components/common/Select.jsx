import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(
  (
    {
      label,
      id,
      name,
      value,
      defaultValue,
      onChange,
      options = [],
      placeholder,
      error,
      helperText,
      disabled = false,
      size = 'md',
      mono = false,
      className = '',
      wrapperClassName = '',
      children,
      required = false,
      ...props
    },
    ref
  ) => {
    const selectId = id || name || `select-${Math.random().toString(36).substring(2, 7)}`;

    const sizeClasses = {
      sm: 'py-1.5 text-xs pl-3 pr-8',
      md: 'py-2 text-xs pl-3.5 pr-8',
      lg: 'py-2.5 text-sm pl-4 pr-10',
    };

    return (
      <div className={`w-full flex flex-col space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 font-sans"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-full appearance-none rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100
              border transition-all duration-150 outline-none cursor-pointer
              ${mono ? 'font-mono' : 'font-sans'}
              ${sizeClasses[size] || sizeClasses.md}
              ${
                error
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400">
                {placeholder}
              </option>
            )}
            {children
              ? children
              : options.map((opt) => (
                  <option
                    key={typeof opt === 'string' ? opt : opt.value}
                    value={typeof opt === 'string' ? opt : opt.value}
                    disabled={opt.disabled}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
                  >
                    {typeof opt === 'string' ? opt : opt.label}
                  </option>
                ))}
          </select>

          <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4 opacity-70" />
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 font-sans mt-0.5">{error}</p>
        )}

        {!error && helperText && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
