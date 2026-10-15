import React from 'react';
import { Bell } from 'lucide-react';

const TAB_METADATA = {
  'search-trips': {
    title: 'Search Trips',
    subtitle: 'Find and book your next journey',
  },
  'my-bookings': {
    title: 'My Bookings',
    subtitle: 'Manage your active reservations',
  },
  'cancel-ticket': {
    title: 'Cancel Ticket',
    subtitle: 'Instant policy-driven refund estimation',
  },
  'track-refunds': {
    title: 'Track Refunds',
    subtitle: 'Real-time bank processing timeline',
  },
  'my-profile': {
    title: 'My Profile',
    subtitle: 'Manage your personal details and account',
  },
  'offers': {
    title: 'Offers',
    subtitle: 'Exclusive discounts and promotional codes',
  },
  'get-support': {
    title: 'Get Support',
    subtitle: 'Customer assistance and dispute tickets',
  },
  'lost-found': {
    title: 'Lost & Found',
    subtitle: 'Report forgotten luggage or personal items',
  },
};

export default function Header({
  activeTab,
  customer,
  isApiLive,
  unreadCount,
  onOpenNotif,
}) {
  const meta = TAB_METADATA[activeTab] || {
    title: 'Click2Book Portal',
    subtitle: 'Online bus reservation system',
  };

  const firstName = customer?.name ? customer.name.split(' ')[0] : 'Customer';

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{meta.title}</h1>
        <p className="header-subtitle">
          {customer?.isLoggedIn ? `Welcome back, ${firstName}! · ` : ''}
          {meta.subtitle}
        </p>
      </div>

      <div className="header-right">
        {/* Notifications Trigger */}
        <button
          className="notif-btn"
          onClick={onOpenNotif}
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="notif-count-dot">{unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
