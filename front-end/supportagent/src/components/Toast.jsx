import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { dismissToast } from '../store/actions';

export default function Toast() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui.toasts);
  const onDismiss = (id) => dispatch(dismissToast(id));
  if (!toasts.length) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="#16A34A" />;
      case 'error':
        return <AlertCircle size={16} color="#DC2626" />;
      default:
        return <Info size={16} color="#2563EB" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          {getIcon(t.type)}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.6,
              display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
