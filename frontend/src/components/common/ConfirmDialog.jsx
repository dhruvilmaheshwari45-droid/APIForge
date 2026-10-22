import React from 'react';
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
}) => {
  const icons = {
    danger: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    primary: <HelpCircle className="w-5 h-5 text-brand-500" />,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center space-x-2.5">
          {icons[variant] || icons.primary}
          <ModalTitle>{title}</ModalTitle>
        </div>
      </ModalHeader>

      <ModalBody>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
          {message}
        </p>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDialog;
