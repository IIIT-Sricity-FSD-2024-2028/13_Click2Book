import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss, toast, onClose }) {
  const activeList = toasts ? toasts : (toast ? [toast] : []);
  const dismissFn = onDismiss || onClose || (() => {});

  useEffect(() => {
    if (toast && dismissFn) {
      const timer = setTimeout(() => {
        dismissFn(toast.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dismissFn]);

  if (!activeList || activeList.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {activeList.map((t) => {
        const typeClass =
          t.type === 'error'
            ? 'c2b-toast-error'
            : t.type === 'success'
            ? 'c2b-toast-success'
            : 'c2b-toast-info';

        return (
          <div key={t.id || t.message} className={`c2b-toast ${typeClass}`} role="alert" style={{ position: 'relative', bottom: 'auto', right: 'auto' }}>
            {t.type === 'success' && <CheckCircle2 size={18} color="#22c55e" />}
            {t.type === 'error' && <AlertCircle size={18} color="#ef4444" />}
            {t.type === 'info' && <Info size={18} color="#3b82f6" />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismissFn(t.id)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
