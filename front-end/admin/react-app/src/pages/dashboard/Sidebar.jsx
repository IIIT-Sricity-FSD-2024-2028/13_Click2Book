import { clearAdminSession } from '../../lib/session.js';
import { SECTIONS } from './sections.js';

function logout() {
  if (!window.confirm('Are you sure you want to logout?')) return;
  clearAdminSession();
  location.href = '/landing-page/index.html';
}

export default function Sidebar({ section, collapsed, adminName, initials, onNavigate, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
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
        <a href="/admin/revenue-dashboard.html" className="nav-item">
          <span className="nav-icon">₹</span><span>Total Revenue</span>
        </a>
      </nav>
      <div className="sidebar-spacer" />
      <nav className="sidebar-nav sidebar-nav-bottom">
        <button className="nav-item nav-logout" onClick={logout}>
          <span className="nav-icon">↪</span><span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
