import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      addToast: (title: string, message?: string) => console.log('[Toast]', title, message),
      removeToast: () => {}
    };
  }
  return ctx;
};
