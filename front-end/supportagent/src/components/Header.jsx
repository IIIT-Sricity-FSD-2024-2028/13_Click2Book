import React, { useState, useEffect } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';

const TAB_TITLES = {
  dashboard: {
    title: 'Support Operations Dashboard',
    sub: 'Real-time KPI metrics & live customer query queue',
  },
  tickets: {
    title: 'Support Tickets Desk',
    sub: 'Multi-criteria search, ticket inspection & resolution engine',
  },
  escalated: {
    title: 'Escalated Issues Desk',
    sub: 'Critical customer escalations requiring supervisor intervention',
  },
  customers: {
    title: 'Customer Directory & History',
    sub: 'Passenger profiles, contact credentials & booking lookup',
  },
  refunds: {
    title: 'Refunds Processing Desk',
    sub: 'Policy-based refund approvals, disbursements & status workflow',
  },
};

export default function Header({
  activeTab,
  isLive,
  unreadCount = 0,
  onToggleNotifications,
  agent,
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[activeTab] || {
    title: 'Customer Support Portal',
    sub: 'Click2Book Customer Assistance Center',
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{meta.title}</h1>
        <p>{meta.sub}</p>
      </div>

      <div className="topbar-right">
        {/* Live Connectivity Badge */}
        <div className={`live-badge ${isLive ? 'online' : 'offline'}`}>
          {isLive ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isLive ? '● Live API Sync' : '● Offline DB Mode'}</span>
        </div>

        {/* Real-time Clock */}
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#64748B',
            fontWeight: 600,
            background: '#F1F5F9',
            padding: '5px 10px',
            borderRadius: '6px',
          }}
        >
          {timeStr}
        </span>

        {/* Notification Bell */}
        <button
          className="bell-btn"
          onClick={onToggleNotifications}
          title="View Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
        </button>

        {/* Avatar Profile */}
        <div
          className="topbar-avatar-btn"
          title={`Signed in as ${agent?.name || 'Support Agent'}`}
        >
          {agent?.avatar || 'SA'}
        </div>
      </div>
    </header>
  );
}
