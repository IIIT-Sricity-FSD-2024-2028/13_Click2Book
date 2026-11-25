import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Bus,
  Search,
  Calendar,
  XCircle,
  RotateCcw,
  User,
  Tag,
  Headphones,
  Briefcase,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  navigateTabThunk,
  logoutCustomerThunk,
  setLoginModal,
  setRedirectAfterLogin,
} from '../store/actions';

export default function Sidebar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.ui.activeTab);
  const customer = useSelector((state) => state.auth.user);
  const setActiveTab = (tab) => dispatch(navigateTabThunk(tab));
  const onNavigate = setActiveTab;
  const onLogout = () => dispatch(logoutCustomerThunk());
  const onOpenLogin = (opts) => dispatch(setLoginModal({ isOpen: true, ...(opts || {}) }));
  const isLoggedIn = Boolean(customer && customer.isLoggedIn);
  const name = customer?.name || 'Customer';
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CU';

  const navItems = [
    { id: 'search-trips', label: 'Search Trips', icon: Search },
    { id: 'my-bookings',  label: 'My Bookings',  icon: Calendar },
    { id: 'cancel-ticket', label: 'Cancel Ticket', icon: XCircle },
    { id: 'track-refunds', label: 'Track Refunds', icon: RotateCcw },
    { id: 'offers',       label: 'Offers',       icon: Tag },
    { id: 'get-support',  label: 'Get Support',  icon: Headphones },
    { id: 'lost-found',   label: 'Lost & Found', icon: Briefcase },
    { id: 'my-profile',   label: 'My Profile',   icon: User },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div
        className="sidebar-logo"
        onClick={() => {
          if (setActiveTab) setActiveTab('landing');
          else if (onNavigate) onNavigate('landing');
        }}
        style={{ cursor: 'pointer' }}
        title="Go to Click2Book Home"
      >
        <div className="logo-icon">
          <Bus size={20} color="#ffffff" />
        </div>
        <div className="logo-text">
          CLICK<span className="logo-accent">2</span>BOOK
        </div>
      </div>

      {/* Profile Card */}
      <div
        className="profile-card"
        id="profileCard"
        onClick={() => (isLoggedIn ? setActiveTab('my-profile') : onOpenLogin())}
        title={isLoggedIn ? 'View your profile' : 'Click to sign in'}
      >
        <div className="profile-avatar">
          {customer?.avatar ? (
            <img
              src={customer.avatar}
              alt="Avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{isLoggedIn ? initials : '👤'}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-name">
            {isLoggedIn ? name : 'Guest'}
          </div>
          <div className="profile-badge">
            {isLoggedIn ? 'CUSTOMER' : 'GUEST'}
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (['my-bookings', 'cancel-ticket', 'my-profile', 'get-support'].includes(item.id) && !isLoggedIn) {
                  const msg = item.id === 'get-support'
                    ? 'Please sign in to access customer support.'
                    : `Please sign in to access ${item.label.toLowerCase()}.`;
                  dispatch(setRedirectAfterLogin(`#${item.id}`));
                  if (onOpenLogin) {
                    onOpenLogin({
                      promptMessage: msg,
                      redirectAfterLogin: `#${item.id}`,
                    });
                  }
                } else {
                  if (setActiveTab) setActiveTab(item.id);
                }
              }}
            >
              <span className="nav-icon">
                <Icon size={17} />
              </span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout / Login */}
      <div className="sidebar-footer">
        {isLoggedIn ? (
          <button className="logout-btn" id="logoutBtn" onClick={onLogout} title="Sign out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button className="logout-btn" id="logoutBtn" onClick={onOpenLogin} title="Sign in">
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
}
