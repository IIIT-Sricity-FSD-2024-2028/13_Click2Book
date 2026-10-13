/** Small building blocks shared by the admin console sections. */
import { useEffect } from 'react';

export const matches = (q, ...fields) =>
  !q ||
  fields.some((v) =>
    String(v ?? '')
      .toLowerCase()
      .includes(q),
  );

export function EmptyRow({ icon, message, cols = 12 }) {
  return (
    <tr>
      <td colSpan={cols} className="empty-cell">
        <div className="empty-icon">{icon}</div>
        <p>{message}</p>
      </td>
    </tr>
  );
}

/** White card with a title row; `actions` sit on the right. */
export function Card({ title, count, actions, children, id }) {
  return (
    <section className="bookings-section" id={id}>
      <div className="section-header">
        <h2 className="section-title">
          {title} {count != null && <span className="count-pill">{count}</span>}
        </h2>
        {actions && <div className="filter-bar">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Table({ head, children, id }) {
  return (
    <div className="table-wrap">
      <table className="bookings-table" id={id}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="admin-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'admin-modal' + (wide ? ' wide' : '')} role="dialog" aria-label={title}>
        <div className="admin-modal-head">
          <h3>{title}</h3>
          <button className="admin-modal-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function KPI({ label, value, sub, tone }) {
  return (
    <div className={'kpi' + (tone ? ` kpi-${tone}` : '')}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export const Pill = ({ tone = 'grey', children }) => <span className={`pill pill-${tone}`}>{children}</span>;
