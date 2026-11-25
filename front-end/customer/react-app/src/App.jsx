import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationDrawer from './components/NotificationDrawer';
import Toast from './components/Toast';
import Login from './components/Login';
import SearchTrips from './components/SearchTrips';
import MyBookings from './components/MyBookings';
import CancelTicket from './components/CancelTicket';
import TrackRefunds from './components/TrackRefunds';
import MyProfile from './components/MyProfile';
import Offers from './components/Offers';
import GetSupport from './components/GetSupport';
import LostFound from './components/LostFound';
import { liveSync } from './services/liveSync';
import {
  deleteSession,
  setLoginModal,
  setActiveTab,
  setTripStatus,
  markTripNotified,
  createNotification,
  navigateTabThunk,
  showToastThunk,
} from './store/actions';

const PROTECTED_TABS = ['my-bookings', 'cancel-ticket', 'my-profile', 'get-support'];

function isDepartureTimeReached(journeyDate, departureTime) {
  try {
    if (!departureTime || departureTime === '—') return false;
    const cleanTime = String(departureTime).split('→')[0].trim();
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return false;
    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hh < 12) hh += 12;
    if (meridiem === 'AM' && hh === 12) hh = 0;

    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    let d = now.getDate();

    if (journeyDate) {
      const dateStr = String(journeyDate).split('T')[0];
      const dateParts = dateStr.split('-').map(Number);
      if (dateParts.length >= 3) {
        y = dateParts[0];
        m = dateParts[1] - 1;
        d = dateParts[2];
      }
    }

    const depDate = new Date(y, m, d, hh, mm, 0, 0);
    if (isNaN(depDate.getTime())) return false;
    return now >= depDate;
  } catch {
    return false;
  }
}

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const activeTab = useSelector((state) => state.ui.activeTab);
  const bookings = useSelector((state) => state.bookings.items);
  const schedules = useSelector((state) => state.trips.items);
  const tripStatuses = useSelector((state) => state.trips.tripStatuses);
  const notifiedTripIds = useSelector((state) => state.notifications.notifiedTripIds);

  const showToast = useCallback(
    (message, type = 'info') => dispatch(showToastThunk(message, type)),
    [dispatch]
  );

  // Listen for deactivated session events
  useEffect(() => {
    const handleAccountInvalidation = (event) => {
      const message = event.detail?.message || 'Your session is no longer valid. Please log in again.';
      dispatch(deleteSession());
      dispatch(setActiveTab('landing'));
      dispatch(
        setLoginModal({
          isOpen: true,
          initialPanel: 'login',
          promptMessage: message,
        })
      );
      if (window.location.hash) window.location.hash = '';
    };

    window.addEventListener('c2b_account_deactivated', handleAccountInvalidation);
    return () => window.removeEventListener('c2b_account_deactivated', handleAccountInvalidation);
  }, [dispatch]);

  // Watch for bus trips starting and alert customer via Redux memory state
  useEffect(() => {
    const checkTripStatuses = () => {
      bookings.forEach((b) => {
        if (b.status === 'CANCELLED') return;
        const tid = b.tripId || b.scheduleId || b.id;
        if (!tid) return;

        const sched = schedules.find((s) => s.id === tid || s.tripId === tid);
        const jDate = b.date || b.journeyDate || sched?.journeyDate;
        const depTime = b.departureTime || sched?.departureTime;

        const curStatus = tripStatuses[tid] || b.tripStatus || 'SCHEDULED';
        const timePassed = isDepartureTimeReached(jDate, depTime);

        if ((curStatus === 'SCHEDULED' || !tripStatuses[tid]) && timePassed) {
          dispatch(setTripStatus({ tripId: tid, status: 'IN_PROGRESS' }));
        }

        const isStarted = tripStatuses[tid] === 'IN_PROGRESS' || timePassed;
        if (isStarted && !notifiedTripIds.includes(tid)) {
          dispatch(markTripNotified(tid));
          const busTitle = b.busName || sched?.busName || 'Your bus';
          const routeText = `${b.from || sched?.from || 'Origin'} → ${b.to || sched?.to || 'Destination'}`;

          showToast(`🚌 ${busTitle} (${routeText}) has started its journey!`, 'success');
          dispatch(
            createNotification({
              id: `trip_start_${tid}_${Date.now()}`,
              tripStartKey: `trip_start_${tid}`,
              title: '🚌 Bus Has Started!',
              desc: `${busTitle} (${routeText}) has departed at ${depTime || 'scheduled time'}.`,
              time: 'Just now',
              type: 'success',
              read: false,
              unread: true,
            })
          );
        }
      });
    };

    checkTripStatuses();
    const interval = setInterval(checkTripStatuses, 4000);
    return () => clearInterval(interval);
  }, [bookings, schedules, tripStatuses, notifiedTripIds, dispatch, showToast]);

  // Real-time cross-actor synchronization (Service Provider, Admin, Super Admin)
  useEffect(() => {
    liveSync.init();
    const unsubscribe = liveSync.subscribe((event) => {
      if (event.type === 'TRIP_STATUS_UPDATED') {
        const { tripId, status } = event.payload || {};
        if (status === 'IN_PROGRESS' && tripId && !notifiedTripIds.includes(tripId)) {
          dispatch(markTripNotified(tripId));
          showToast(`🚌 Your bus (Trip ${tripId}) has departed!`, 'success');
        }
      } else if (event.type === 'SCHEDULE_UPDATED') {
        const p = event.payload || {};
        if (p.from && p.to) {
          showToast(`🚌 New bus schedule available: ${p.busName || 'Bus'} (${p.from} → ${p.to})`, 'info');
        }
      }
    });
    return () => unsubscribe();
  }, [dispatch, notifiedTripIds, showToast]);

  // Hash Routing Synchronization with Route Guards
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#[/]?/, '').trim();
      const tabName = hash.split('?')[0];

      if (!tabName || tabName === 'landing' || tabName === 'home') {
        dispatch(setActiveTab('landing'));
        return;
      }

      if (tabName === 'login') {
        dispatch(setLoginModal({ isOpen: true, initialPanel: 'login' }));
        return;
      }

      if (tabName === 'signup') {
        dispatch(setLoginModal({ isOpen: true, initialPanel: 'signup' }));
        return;
      }

      if (PROTECTED_TABS.includes(tabName) && (!user || !user.isLoggedIn)) {
        const msg =
          tabName === 'get-support'
            ? 'Please sign in to access customer support.'
            : 'Please sign in to access your account.';
        showToast(msg, 'info');
        dispatch(
          setLoginModal({
            isOpen: true,
            initialPanel: 'login',
            promptMessage: msg,
            redirectAfterLogin: `#${tabName}`,
          })
        );
        dispatch(setActiveTab('landing'));
        window.location.hash = '';
        return;
      }

      const validTabs = [
        'search-trips',
        'my-bookings',
        'cancel-ticket',
        'track-refunds',
        'offers',
        'get-support',
        'lost-found',
        'my-profile',
      ];

      if (validTabs.includes(tabName)) {
        dispatch(navigateTabThunk(tabName));
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, dispatch, showToast]);

  return (
    <div className="customer-app-layout">
      <Toast />
      <NotificationDrawer />
      <Login />

      {activeTab === 'landing' ? (
        <LandingPage />
      ) : (
        <>
          <Sidebar />
          <main className="main-content">
            <Header />
            {activeTab === 'search-trips' && <SearchTrips />}
            {activeTab === 'my-bookings' && <MyBookings />}
            {activeTab === 'cancel-ticket' && <CancelTicket />}
            {activeTab === 'track-refunds' && <TrackRefunds />}
            {activeTab === 'offers' && <Offers />}
            {activeTab === 'get-support' && <GetSupport />}
            {activeTab === 'lost-found' && <LostFound />}
            {activeTab === 'my-profile' && <MyProfile />}
          </main>
        </>
      )}
    </div>
  );
}
