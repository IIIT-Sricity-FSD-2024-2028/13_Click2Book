import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((toast) => {
        const typeClass =
          toast.type === 'error'
            ? 'c2b-toast-error'
            : toast.type === 'success'
            ? 'c2b-toast-success'
            : 'c2b-toast-info';

        return (
          <div key={toast.id} className={`c2b-toast ${typeClass}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="#22c55e" />}
            {toast.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
            {toast.type === 'info' && <Info size={18} color="#3b82f6" />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
