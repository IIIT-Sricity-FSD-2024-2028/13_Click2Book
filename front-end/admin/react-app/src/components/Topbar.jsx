import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SECTIONS } from '../data/sections.js';
import { initialsOf } from '../lib/session.js';
import {
  loadAdminDashboardThunk,
  navigateSectionThunk,
  setBookingSearch,
  showToastThunk,
  logoutAdminThunk,
} from '../store/actions';

export default function Topbar() {
  const dispatch = useDispatch();
  const section = useSelector((state) => state.ui.section);
  const refreshing = useSelector((state) => state.ui.refreshing);
  const adminName = useSelector((state) => state.auth.user?.name || 'Admin User');
  const initials = initialsOf(adminName) || 'AD';
  const title = (SECTIONS.find(([id]) => id === section) || SECTIONS[0])[2];

  const [search, setSearch] = useState('');

  const handleSearch = (value) => {
    setSearch(value);
    if (value) {
      dispatch(setBookingSearch(value));
      dispatch(navigateSectionThunk('bookings'));
    }
  };
  const onRefresh = () => dispatch(loadAdminDashboardThunk());
  const onNotify = (msg) => dispatch(showToastThunk(msg));
  const onLogout = () => dispatch(logoutAdminThunk());

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Admin Control Panel</p>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn refresh-btn" type="button" aria-label="Refresh dashboard data" title="Refresh dashboard data" onClick={onRefresh} disabled={refreshing}>⟳</button>
        <div className="topbar-search">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search bookings, users…" aria-label="Search bookings and users" />
        </div>
        <button className="topbar-btn" aria-label="Notifications" onClick={() => onNotify('No new notifications.')}>♧<span className="notif-dot" /></button>
        <button className="topbar-avatar" aria-label="Admin profile">{initials}</button>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            style={{
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s',
            }}
          >
            <span>↪</span> Logout
          </button>
        )}
      </div>
    </header>
  );
}
