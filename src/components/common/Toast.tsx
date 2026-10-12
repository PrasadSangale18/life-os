import React, { useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastContext } from './toastContext';
import type { ToastItem, ToastType } from './toastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, title, message, type };

    setToasts((prev) => {
      // Prevent exact duplicate notifications from stacking up
      if (prev.some((t) => t.title === title && t.message === message)) {
        return prev;
      }
      return [...prev.slice(-2), newToast]; // Max 3 visible
    });

    window.setTimeout(() => {
      removeToast(id);
    }, 2500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const ToastContainer: React.FC = () => {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;

  const { toasts, removeToast } = ctx;

  const icons = {
    success: <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />,
    warning: <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />,
    error: <XCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />,
    info: <Info size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
  };

  const borderStyles = {
    success: {
      border: 'rgba(16, 185, 129, 0.3)',
      bg: 'var(--bg-surface, #ffffff)',
      accent: '#10b981',
      shadow: '0 8px 30px rgba(16, 185, 129, 0.12)'
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.3)',
      bg: 'var(--bg-surface, #ffffff)',
      accent: '#f59e0b',
      shadow: '0 8px 30px rgba(245, 158, 11, 0.12)'
    },
    error: {
      border: 'rgba(239, 68, 68, 0.3)',
      bg: 'var(--bg-surface, #ffffff)',
      accent: '#ef4444',
      shadow: '0 8px 30px rgba(239, 68, 68, 0.12)'
    },
    info: {
      border: 'rgba(59, 130, 246, 0.3)',
      bg: 'var(--bg-surface, #ffffff)',
      accent: '#3b82f6',
      shadow: '0 8px 30px rgba(59, 130, 246, 0.12)'
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 380,
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const style = borderStyles[toast.type];
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              borderRadius: 14,
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              borderLeft: `4px solid ${style.accent}`,
              boxShadow: `${style.shadow}, var(--shadow-lg)`,
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)'
            }}
          >
            {icons[toast.type]}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div 
                style={{ 
                  fontSize: 13, 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3
                }}
              >
                {toast.title}
              </div>
              {toast.message && (
                <div 
                  style={{ 
                    fontSize: 12, 
                    color: 'var(--text-secondary)', 
                    marginTop: 3, 
                    lineHeight: 1.45 
                  }}
                >
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 3,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
