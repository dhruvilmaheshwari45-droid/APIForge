import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title }),
    warning: (message, title = 'Warning') => addToast({ type: 'warning', message, title }),
    info: (message, title = 'Info') => addToast({ type: 'info', message, title }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    iconColor: 'text-emerald-400',
    icon: CheckCircle2,
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  error: {
    bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
    iconColor: 'text-rose-400',
    icon: AlertCircle,
    badge: 'bg-rose-500/20 text-rose-300',
  },
  warning: {
    bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
    iconColor: 'text-amber-400',
    icon: AlertTriangle,
    badge: 'bg-amber-500/20 text-amber-300',
  },
  info: {
    bg: 'bg-slate-900/95 border-brand-500/40 text-slate-100',
    iconColor: 'text-brand-400',
    icon: Info,
    badge: 'bg-brand-500/20 text-brand-300',
  },
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
        const IconComponent = style.icon;

        return (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-200 animate-slideUp ${style.bg}`}
          >
            <div className="shrink-0 mt-0.5">
              <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {item.title && (
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-semibold tracking-wide font-mono">{item.title}</h4>
                </div>
              )}
              {item.message && (
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed font-sans">{item.message}</p>
              )}
            </div>

            <button
              onClick={() => onDismiss(item.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContext;
