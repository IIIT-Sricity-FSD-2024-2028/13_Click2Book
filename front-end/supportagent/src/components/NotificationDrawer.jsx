import React from 'react';
import {
  X,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  CheckCheck,
} from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
}) {
  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'urgent':
        return (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FFE4E6',
              color: '#E11D48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={18} />
          </div>
        );
      case 'warn':
        return (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
        );
      case 'info':
        return (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#DBEAFE',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={18} />
          </div>
        );
      case 'success':
        return (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} />
          </div>
        );
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`drawer-item ${!n.read ? 'unread' : ''}`}
            >
              {getIcon(n.type)}
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: '2px',
                  }}
                >
                  {n.title}
                </h4>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748B',
                    lineHeight: 1.4,
                    marginBottom: '4px',
                  }}
                >
                  {n.desc}
                </p>
                <time
                  style={{
                    fontSize: '0.68rem',
                    color: '#94A3B8',
                    fontWeight: 600,
                  }}
                >
                  {n.time}
                </time>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={onMarkAllRead}
            style={{ fontSize: '0.75rem' }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={onClose}
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
}
