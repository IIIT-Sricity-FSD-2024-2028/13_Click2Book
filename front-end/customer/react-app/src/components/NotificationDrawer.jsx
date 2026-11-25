import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { setNotifOpen, markAllNotificationsRead, showToastThunk } from '../store/actions';

export default function NotificationDrawer() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.isNotifOpen);
  const notifications = useSelector((state) => state.notifications.items);
  const onClose = () => dispatch(setNotifOpen(false));
  const onMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
    dispatch(showToastThunk('Notifications marked as read.', 'info'));
  };
  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={17} />;
      case 'warn':
        return <AlertTriangle size={17} />;
      default:
        return <Info size={17} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel">
        <div className="notif-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="notif-count-badge">{unreadCount} New</span>
            )}
          </div>
          <button className="notif-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                <div className={`notif-icon-wrap ${n.type || 'info'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="notif-text" style={{ flex: 1 }}>
                  <h4>{n.title}</h4>
                  <p>{n.desc}</p>
                  <time>{n.time}</time>
                </div>
              </div>
            ))
          )}
        </div>

        {unreadCount > 0 && (
          <div className="notif-panel-footer">
            <button
              onClick={onMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Mark all as read ✓
            </button>
          </div>
        )}
      </div>
    </>
  );
}
