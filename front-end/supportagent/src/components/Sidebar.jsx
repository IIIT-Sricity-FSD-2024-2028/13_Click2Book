import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  AlertTriangle,
  Receipt,
  Users,
  RotateCcw,
  ExternalLink,
  LogOut,
  Headphones,
} from 'lucide-react';
import { navigateToStaffPortal, getStaffPortalUrl } from '../services/api';

export default function Sidebar({
  activeTab,
  setActiveTab,
  agent,
  onLogout,
  openTicketsCount = 0,
  escalationsCount = 0,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'tickets',
      label: 'Support Tickets',
      icon: Ticket,
      badge: openTicketsCount > 0 ? openTicketsCount : null,
    },
    {
      id: 'escalated',
      label: 'Escalated Issues',
      icon: AlertTriangle,
      badge: escalationsCount > 0 ? escalationsCount : null,
      badgeColor: '#EF4444',
    },
    {
      id: 'cost-impact',
      label: 'Ticket Cost Impact',
      icon: Receipt,
    },
    {
      id: 'customers',
      label: 'Customer Lookup',
      icon: Users,
    },
    {
      id: 'refunds',
      label: 'Refunds Desk',
      icon: RotateCcw,
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Headphones size={22} color="#ffffff" />
        </div>
        <div className="brand-info">
          <div className="brand-title">Support Panel</div>
          <div className="brand-sub">Click2Book Operations</div>
        </div>
      </div>

      {/* Agent Profile Widget */}
      <div className="agent-profile">
        <div className="agent-avatar">
          {agent?.avatar || 'SA'}
          <span className="agent-online-dot"></span>
        </div>
        <div className="agent-meta">
          <div className="agent-name">{agent?.name || 'Support Agent'}</div>
          <div className="agent-status-label">● Online (Active)</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <IconComponent size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className="nav-badge"
                  style={item.badgeColor ? { background: item.badgeColor } : undefined}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="sidebar-bottom">
        <a
          href={getStaffPortalUrl()}
          onClick={navigateToStaffPortal}
          className="nav-item"
          title="Return to Staff Portal"
          style={{ cursor: 'pointer' }}
        >
          <ExternalLink size={18} style={{ pointerEvents: 'none' }} />
          <span style={{ pointerEvents: 'none' }}>Staff Portal</span>
        </a>
        <button
          className="nav-item danger"
          onClick={onLogout}
          title="Sign out of Support Panel"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
