import React, { useState, useEffect, useCallback, useRef } from 'react';

import Login              from './components/Login';
import Sidebar            from './components/Sidebar';
import Header             from './components/Header';
import NotificationDrawer from './components/NotificationDrawer';
import Toast              from './components/Toast';

import Dashboard          from './components/Dashboard';
import ManageSchedules    from './components/ManageSchedules';
import AddSchedule        from './components/AddSchedule';
import ConfirmTrips       from './components/ConfirmTrips';
import SeatManagement     from './components/SeatManagement';
import LostFound          from './components/LostFound';
import Revenue            from './components/Revenue';
import Settings           from './components/Settings';

import { getNotifications, autoStartDueTrips } from './services/api';
import { liveSync } from './services/liveSync';

/* ── Valid tabs (sync with hash URL, same approach as support agent) ── */
const VALID_TABS = [
  'dashboard', 'manage-schedules', 'add-schedule',
  'confirm-trips', 'seat-management', 'lost-found', 'revenue', 'settings',
];

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '');
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
    const interval = setInterval(runAutoStart, 4000);
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
    const commonProps = { provider, showToast };
    switch (activeTab) {
      case 'dashboard':        return <Dashboard        {...commonProps} onNavigate={setActiveTab} />;
      case 'manage-schedules': return <ManageSchedules  {...commonProps} onNavigate={setActiveTab} />;
      case 'add-schedule':     return <AddSchedule      {...commonProps} onNavigate={setActiveTab} />;
      case 'confirm-trips':    return <ConfirmTrips     {...commonProps} />;
      case 'seat-management':  return <SeatManagement   {...commonProps} />;
      case 'lost-found':       return <LostFound        {...commonProps} />;
      case 'revenue':          return <Revenue          {...commonProps} />;
      case 'settings':         return <Settings         {...commonProps} />;
      default:                 return <Dashboard        {...commonProps} onNavigate={setActiveTab} />;
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
            {renderPage()}
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
