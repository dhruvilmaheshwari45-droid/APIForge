import React, { useState, useRef, useEffect } from 'react';
import { HTTP_METHODS } from '../../../utils/constants';
import { ChevronDown } from 'lucide-react';

const METHODS = Object.keys(HTTP_METHODS);

export const MethodSelector = ({ value = 'GET', onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = HTTP_METHODS[value?.toUpperCase()] || HTTP_METHODS.GET;

  const handleSelect = (method) => {
    onChange?.(method);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between space-x-2 px-3 py-2 rounded-lg font-mono font-bold text-xs
          border transition-all select-none min-w-[105px]
          ${currentConfig.color}
          ${isOpen ? 'ring-2 ring-brand-500/30 border-brand-500/50' : ''}
        `}
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase text-slate-400">
            HTTP Methods
          </div>
          {METHODS.map((m) => {
            const config = HTTP_METHODS[m];
            const isSelected = value.toUpperCase() === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => handleSelect(m)}
                className={`
                  w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold
                  transition-colors text-left
                  ${isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}
                `}
              >
                <span className={`px-1.5 py-0.5 rounded border text-[11px] ${config.color}`}>
                  {m}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MethodSelector;
