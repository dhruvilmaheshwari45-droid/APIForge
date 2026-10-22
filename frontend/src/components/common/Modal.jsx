import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] h-[90vh]',
};

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdropClick = true,
  className = '',
}) => {
  const modalRef = useRef(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className={`
          relative w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
          text-slate-900 dark:text-slate-100 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]
          animate-scaleIn ${SIZES[size] || SIZES.md} ${className}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export const ModalHeader = ({ children, onClose, className = '' }) => (
  <div
    className={`p-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 ${className}`}
  >
    <div className="flex-1 pr-4">{children}</div>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ModalTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight ${className}`}>
    {children}
  </h3>
);

export const ModalDescription = ({ children, className = '' }) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5 ${className}`}>
    {children}
  </p>
);

export const ModalBody = ({ children, className = '' }) => (
  <div className={`p-5 overflow-y-auto flex-1 custom-scrollbar ${className}`}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '' }) => (
  <div
    className={`p-4 px-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 ${className}`}
  >
    {children}
  </div>
);

export default Modal;
