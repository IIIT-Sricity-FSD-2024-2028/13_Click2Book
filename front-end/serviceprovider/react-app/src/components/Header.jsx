import React from 'react';

const PAGE_TITLES = {
  dashboard:        { title: 'Provider Dashboard',  sub: 'Service Provider Portal' },
  'manage-schedules': { title: 'Manage Schedules',  sub: 'Service Provider Portal' },
  'add-schedule':   { title: 'Add Schedule',         sub: 'Service Provider Portal' },
  'confirm-trips':  { title: 'Confirm Trips',        sub: 'Service Provider Portal' },
  'seat-management':{ title: 'Seat Management',      sub: 'Service Provider Portal' },
  'lost-found':     { title: 'Lost & Found',         sub: 'Items reported by customers on your trips' },
  revenue:          { title: 'My Revenue',           sub: 'Provider Revenue & Fleet Performance' },
  settings:         { title: 'Settings',             sub: 'Manage your account preferences' },
};

export default function Header({ activeTab, unreadCount, onToggleNotifications }) {
  const { title, sub } = PAGE_TITLES[activeTab] || { title: 'Provider Panel', sub: 'Click2Book' };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <div className="topbar-actions">
        <button className="bell-btn" onClick={onToggleNotifications} aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
