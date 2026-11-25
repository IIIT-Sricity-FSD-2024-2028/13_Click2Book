import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

import { liveSync } from './services/liveSync';
import {
  deleteSession,
  setAccountAccessError,
  fetchNotificationsThunk,
  autoStartDueTripsThunk,
  navigateTabThunk,
  showToastThunk,
} from './store/actions';

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

export default function App() {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.provider);
  const activeTab = useSelector((state) => state.ui.activeTab);

  const showToast = useCallback(
    (message, type = 'info') => dispatch(showToastThunk(message, type)),
    [dispatch]
  );

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
  }, [dispatch]);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'add-schedule') {
        dispatch(navigateTabThunk('fleet-management'));
      } else if (VALID_TABS.includes(hash)) {
        dispatch(navigateTabThunk(hash));
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [dispatch]);

  useEffect(() => {
    const onDeactivated = (event) => {
      dispatch(deleteSession());
      dispatch(
        setAccountAccessError(
          event.detail?.message ||
            'Your service provider account has been deactivated by the administrator. You cannot log in. Please contact customer support for assistance.'
        )
      );
      window.location.hash = '';
    };
    window.addEventListener('c2b_account_deactivated', onDeactivated);
    return () => window.removeEventListener('c2b_account_deactivated', onDeactivated);
  }, [dispatch]);

  useEffect(() => {
    const runAutoStart = async () => {
      const action = await dispatch(autoStartDueTripsThunk());
      const newlyStarted = action.payload;
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
  }, [dispatch, showToast]);

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

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':        return <Dashboard />;
      case 'fleet-management': return <BusFleetManagement />;
      case 'manage-schedules': return <ManageSchedules />;
      case 'add-schedule':     return <BusFleetManagement />;
      case 'confirm-trips':    return <ConfirmTrips />;
      case 'seat-management':  return <SeatManagement />;
      case 'coupons':          return <Coupons />;
      case 'reviews':          return <Reviews />;
      case 'lost-found':       return <LostFound />;
      case 'revenue':          return <Revenue />;
      case 'escalations':      return <Escalations />;
      case 'settings':         return <Settings />;
      default:                 return <Dashboard />;
    }
  };

  if (!provider) {
    return (
      <>
        <Login />
        <Toast />
      </>
    );
  }

  return (
    <>
      <div className="app-layout">
        <Sidebar />

        <div className="main-area">
          <Header />
          <div className="content-body">
            <ErrorBoundary>
              {renderPage()}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <NotificationDrawer />
      <Toast />
    </>
  );
}
