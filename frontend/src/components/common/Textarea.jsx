import React from 'react';

export const Textarea = React.forwardRef(
  (
    {
      label,
      id,
      name,
      value,
      defaultValue,
      onChange,
      placeholder,
      rows = 4,
      error,
      helperText,
      disabled = false,
      readOnly = false,
      mono = false,
      resize = 'vertical', // 'none' | 'vertical' | 'horizontal' | 'both'
      className = '',
      wrapperClassName = '',
      required = false,
      ...props
    },
    ref
  ) => {
    const textareaId = id || name || `textarea-${Math.random().toString(36).substring(2, 7)}`;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className={`w-full flex flex-col space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 font-sans"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`
            w-full rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            p-3 text-xs border transition-all duration-150 outline-none
            ${mono ? 'font-mono' : 'font-sans'}
            ${resizeClasses[resize] || 'resize-y'}
            ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

export default Textarea;
