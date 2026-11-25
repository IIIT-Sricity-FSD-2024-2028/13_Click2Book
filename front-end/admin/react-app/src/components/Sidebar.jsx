import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SECTIONS } from '../data/sections.js';
import { initialsOf } from '../lib/session.js';
import {
  navigateSectionThunk,
  navigateRouteThunk,
  logoutAdminThunk,
  toggleCollapsed,
} from '../store/actions';

export default function Sidebar() {
  const dispatch = useDispatch();
  const section = useSelector((state) => state.ui.section);
  const collapsed = useSelector((state) => state.ui.collapsed);
  const adminName = useSelector((state) => state.auth.user?.name || 'Admin User');
  const initials = initialsOf(adminName) || 'AD';

  const onNavigate = (id) => dispatch(navigateSectionThunk(id));
  const onToggle = () => dispatch(toggleCollapsed());
  const onViewRevenue = () => dispatch(navigateRouteThunk('revenue'));
  const handleLogout = () => dispatch(logoutAdminThunk());

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ overflowY: 'auto' }}>
      <div className="sidebar-brand">
        <div className="brand-icon">▦</div>
        <div className="brand-text">
          <span className="brand-title">Click2Book</span>
          <span className="brand-sub">Admin Panel</span>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">☰</button>
      </div>
      <div className="admin-card">
        <div className="admin-avatar">{initials}</div>
        <div className="admin-info">
          <span className="admin-name">{adminName}</span>
          <span className="admin-role">System Administrator</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {SECTIONS.map(([id, label, , icon]) => (
          <button key={id} className={`nav-item ${section === id ? 'active' : ''}`} onClick={() => onNavigate(id)} title={label}>
            <span className="nav-icon">{icon}</span><span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          className="nav-item"
          onClick={() => {
            if (onViewRevenue) onViewRevenue();
            else window.location.hash = '#revenue';
          }}
          title="Total Revenue"
        >
          <span className="nav-icon">₹</span><span>Total Revenue</span>
        </button>
      </nav>
      <div className="sidebar-spacer" style={{ minHeight: '20px' }} />
      <nav className="sidebar-nav sidebar-nav-bottom">
        <button className="nav-item nav-logout" onClick={handleLogout} title="Logout" style={{ color: '#f87171' }}>
          <span className="nav-icon">↪</span><span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
