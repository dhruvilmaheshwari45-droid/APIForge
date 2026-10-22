import React, { useState, useRef, useEffect } from 'react';

export const Dropdown = ({
  trigger,
  children,
  align = 'right', // 'left' | 'right'
  width = 'w-56',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 ${width} rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
            shadow-xl shadow-slate-950/20 p-1.5 focus:outline-none animate-slideDown
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  children,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
  className = '',
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`
      w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-sans text-left transition-colors
      ${
        danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
      ${className}
    `}
  >
    {Icon && <Icon className="w-4 h-4 shrink-0 opacity-80" />}
    <span className="flex-1 truncate">{children}</span>
  </button>
);

export const DropdownHeader = ({ children, className = '' }) => (
  <div
    className={`px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1 ${className}`}
  >
    {children}
  </div>
);

export const DropdownDivider = ({ className = '' }) => (
  <div
    className={`my-1 border-t border-slate-100 dark:border-slate-800/80 ${className}`}
  />
);

export default Dropdown;
