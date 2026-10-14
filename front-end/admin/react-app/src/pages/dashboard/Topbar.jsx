import { useState } from 'react';

export default function Topbar({ title, initials, onSearch, onNotify, onRefresh, refreshing, lastSynced, hasSyncError }) {
  const [search, setSearch] = useState('');

  const handleSearch = (value) => {
    setSearch(value);
    if (value) onSearch(value);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Super User Control Panel</p>
      </div>
      <div className="topbar-right">
        <div className="live-sync" aria-live="polite">
          <span className={`live-sync-dot ${refreshing ? 'is-refreshing' : ''} ${hasSyncError ? 'is-offline' : ''}`} />
          <span>{refreshing ? 'Syncing…' : lastSynced ? `${hasSyncError ? 'Stale' : 'Live'} · ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting…'}</span>
        </div>
        <button className="topbar-btn refresh-btn" type="button" aria-label="Refresh dashboard data" title="Refresh dashboard data" onClick={onRefresh} disabled={refreshing}>⟳</button>
        <div className="topbar-search">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search bookings, users…" aria-label="Search bookings and users" />
        </div>
        <button className="topbar-btn" aria-label="Notifications" onClick={() => onNotify('No new notifications.')}>♧<span className="notif-dot" /></button>
        <button className="topbar-avatar" aria-label="Admin profile">{initials}</button>
      </div>
    </header>
  );
}
