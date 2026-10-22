import React from 'react';
export { ToastProvider, useToast } from '../../context/ToastContext';

export const Toast = ({ type = 'info', title, message, onDismiss }) => {
  return null; // Component render is handled by ToastContainer via ToastProvider
};

export default Toast;
