import React, { useState, useEffect, useCallback, useRef } from 'react';

import Login              from './components/Login';
import Sidebar            from './components/Sidebar';
import Header             from './components/Header';
import NotificationDrawer from './components/NotificationDrawer';
import Toast              from './components/Toast';

import Dashboard          from './components/Dashboard';
import BusFleetManagement from './components/BusFleetManagement';
import ManageSchedules    from './components/ManageSchedules';
import ConfirmTrips       from './components/ConfirmTrips';
import SeatManagement     from './components/SeatManagement';
import LostFound          from './components/LostFound';
import Revenue            from './components/Revenue';
import Coupons            from './components/Coupons';
import Reviews            from './components/Reviews';
import Settings           from './components/Settings';
import Escalations        from './components/Escalations';

import { getNotifications, autoStartDueTrips } from './services/api';
import { liveSync } from './services/liveSync';

/* ── Valid tabs (sync with hash URL, same approach as support agent) ── */
const VALID_TABS = [
  'dashboard', 'fleet-management', 'manage-schedules',
  'confirm-trips', 'seat-management', 'coupons', 'reviews', 'lost-found', 'revenue', 'settings', 'escalations',
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Page render error caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', margin: '2rem auto', maxWidth: 640 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>View Error Recovered</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'A temporary rendering issue occurred in this view.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              🔄 Reload View
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = 'fleet-management';
              }}
            >
              🚍 Go to Fleet
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'add-schedule') return 'fleet-management';
  return VALID_TABS.includes(hash) ? hash : 'dashboard';
}

/* ── Toast helpers ── */
let _toastId = 0;

export default function App() {
  /* ── Auth state ── */
  const [provider, setProvider] = useState(() => {
    const loggedIn =
      sessionStorage.getItem('c2b_loggedIn') === 'true' ||
      localStorage.getItem('c2b_loggedIn') === 'true';
    if (!loggedIn) return null;
    return {
      name:  sessionStorage.getItem('c2b_userName')  || localStorage.getItem('c2b_userName')  || 'Provider',
      email: sessionStorage.getItem('c2b_userEmail') || localStorage.getItem('c2b_userEmail') || '',
      id:    sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'P001',
    };
  });

  /* ── Tab / navigation state ── */
  const [activeTab, setActiveTabState] = useState(getTabFromHash);

  const setActiveTab = useCallback((tab) => {
    if (!VALID_TABS.includes(tab)) return;
    setActiveTabState(tab);
    window.location.hash = tab;
  }, []);

  /* ── Sync URL hash → state ── */
  useEffect(() => {
    const onHash = () => setActiveTabState(getTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* ── Notifications ── */
  const [notifications] = useState(getNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Toasts ── */
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'info') => {
    const id = ++_toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /* ── Background Trip Auto-Starter: auto-starts trip when starting time is reached ── */
  useEffect(() => {
    const runAutoStart = () => {
      const newlyStarted = autoStartDueTrips();
      if (newlyStarted && newlyStarted.length > 0) {
        newlyStarted.forEach((t) => {
          const routeLabel = t.from && t.to ? `${t.from} → ${t.to}` : t.busName || t.tripId;
          showToast(`⏰ Trip Auto-Started: ${routeLabel} (Departure time ${t.time || ''} reached!)`, 'info');
        });
      }
    };
    runAutoStart();
    const interval = setInterval(runAutoStart, 15000);
    return () => clearInterval(interval);
  }, [showToast]);

  /* ── Real-Time Cross-Actor Live Sync (Customer bookings, Trip status, Admin updates) ── */
  useEffect(() => {
    liveSync.init();
    const unsubscribe = liveSync.subscribe((event) => {
      if (event.type === 'BOOKING_CREATED') {
        const p = event.payload || {};
        const pax = p.passengerName || p.customerName || 'Passenger';
        const bus = p.busName || 'Bus';
        const seats = p.seats || (p.seat_list ? p.seat_list.join(', ') : '1 seat');
        showToast(`🎫 New Booking! ${pax} booked seat ${seats} on ${bus}.`, 'success');
      } else if (event.type === 'TRIP_STATUS_UPDATED') {
        const { tripId, status } = event.payload || {};
        if (status === 'IN_PROGRESS') {
          showToast(`🚌 Trip ${tripId} status is now IN PROGRESS.`, 'info');
        }
      } else if (event.type === 'REVIEW_SUBMITTED') {
        const r = event.payload || {};
        showToast(`⭐ New Review! ${r.customerName || 'A passenger'} rated ${r.busName || 'bus'} ${r.rating || 5}★`, 'info');
      }
    });
    return () => unsubscribe();
  }, [showToast]);

  /* ── Login / Logout ── */
  const handleLogin = useCallback((user) => {
    setProvider(user);
    setActiveTab('dashboard');
  }, [setActiveTab]);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem('c2b_loggedIn');
    localStorage.removeItem('c2b_userName');
    localStorage.removeItem('c2b_userEmail');
    localStorage.removeItem('c2b_loggedInId');
    setProvider(null);
    window.location.hash = '';
  }, []);

  /* ── Page renderer ── */
  const renderPage = () => {
    const commonProps = { provider, showToast, onNavigate: setActiveTab };
    switch (activeTab) {
      case 'dashboard':        return <Dashboard        {...commonProps} />;
      case 'fleet-management': return <BusFleetManagement {...commonProps} />;
      case 'manage-schedules': return <ManageSchedules  {...commonProps} />;
      case 'add-schedule':     return <BusFleetManagement {...commonProps} />;
      case 'confirm-trips':    return <ConfirmTrips     {...commonProps} />;
      case 'seat-management':  return <SeatManagement   {...commonProps} />;
      case 'coupons':          return <Coupons          {...commonProps} />;
      case 'reviews':          return <Reviews          {...commonProps} />;
      case 'lost-found':       return <LostFound        {...commonProps} />;
      case 'revenue':          return <Revenue          {...commonProps} />;
      case 'escalations':      return <Escalations      {...commonProps} />;
      case 'settings':         return <Settings         {...commonProps} />;
      default:                 return <Dashboard        {...commonProps} />;
    }
  };

  /* ── Not logged in → show Login page ── */
  if (!provider) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  /* ── Logged in → full dashboard layout ── */
  return (
    <>
      <div className="app-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          provider={provider}
          onLogout={handleLogout}
        />

        <div className="main-area">
          <Header
            activeTab={activeTab}
            unreadCount={unreadCount}
            onToggleNotifications={() => setNotifOpen((o) => !o)}
          />
          <div className="content-body">
            <ErrorBoundary>
              {renderPage()}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
