import React from 'react';

export const Input = React.forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      placeholder,
      value,
      defaultValue,
      onChange,
      error,
      helperText,
      disabled = false,
      readOnly = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      mono = false,
      size = 'md',
      className = '',
      wrapperClassName = '',
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 7)}`;

    const sizeClasses = {
      sm: 'py-1.5 text-xs',
      md: 'py-2 text-xs',
      lg: 'py-2.5 text-sm',
    };

    return (
      <div className={`w-full flex flex-col space-y-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 font-sans"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center w-full">
          {LeftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`
              w-full rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
              border transition-all duration-150 outline-none
              ${mono ? 'font-mono' : 'font-sans'}
              ${sizeClasses[size] || sizeClasses.md}
              ${LeftIcon ? 'pl-9' : 'pl-3.5'}
              ${RightIcon ? 'pr-9' : 'pr-3.5'}
              ${
                error
                  ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                  : 'border-slate-300 dark:border-slate-800 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}
              ${className}
            `}
            {...props}
          />

          {RightIcon && (
            <button
              type="button"
              tabIndex={onRightIconClick ? 0 : -1}
              onClick={onRightIconClick}
              disabled={disabled || !onRightIconClick}
              className={`absolute right-3 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors ${
                onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
              }`}
            >
              <RightIcon className="w-4 h-4" />
            </button>
          )}
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

Input.displayName = 'Input';

export default Input;
