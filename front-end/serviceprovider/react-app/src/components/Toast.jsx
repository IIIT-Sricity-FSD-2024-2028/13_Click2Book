import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast } from '../store/actions';

export default function Toast() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.ui.toasts);
  const onDismiss = (id) => dispatch(dismissToast(id));
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button className="toast-dismiss" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
