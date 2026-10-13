import React from 'react';

export default function NotificationDrawer({ isOpen, onClose, notifications }) {
  const iconFor = (type) => {
    if (type === 'warn') return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
    if (type === 'success') return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    );
  };

  return (
    <>
      <div className={`notif-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`notif-drawer ${isOpen ? 'open' : ''}`}>
        <div className="notif-header">
          <h3>Notifications {notifications.filter(n => !n.read).length > 0 && <span style={{fontSize:'0.72rem',background:'#ef4444',color:'#fff',borderRadius:'20px',padding:'1px 7px',marginLeft:6}}>{notifications.filter(n=>!n.read).length}</span>}</h3>
          <button className="notif-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="notif-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div className={`notif-icon ${n.type}`}>{iconFor(n.type)}</div>
              <div className="notif-text">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <time>{n.time}</time>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
