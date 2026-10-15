import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { INITIAL_NOTIFICATIONS } from './services/mockData';
import { liveSync } from './services/liveSync';

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
  // Authenticated customer state — guest by default if not logged in
  const [user, setUser] = useState(() => {
    const isLoggedIn =
      sessionStorage.getItem('c2b_loggedIn') === 'true' ||
      localStorage.getItem('c2b_loggedIn') === 'true';
    if (!isLoggedIn) return null;

    const id = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'C001';
    const name = sessionStorage.getItem('c2b_userName') || localStorage.getItem('c2b_userName') || 'Rahul Sharma';
    const email = sessionStorage.getItem('c2b_userEmail') || localStorage.getItem('c2b_userEmail') || 'rahul.sharma@email.com';
    const phone = sessionStorage.getItem('c2b_userPhone') || localStorage.getItem('c2b_userPhone') || '+91 9876543210';
    const avatar = sessionStorage.getItem('c2b_user_avatar') || localStorage.getItem('c2b_user_avatar') || '';
    const role = sessionStorage.getItem('c2b_userRole') || localStorage.getItem('c2b_userRole') || 'CUSTOMER';

    return { id, name, email, phone, avatar, role, isLoggedIn: true };
  });

  // Navigation / Tabs: root defaults to landing page
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '').trim();
    const tabName = hash.split('?')[0];

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

    if (tabName && validTabs.includes(tabName)) {
      return tabName;
    }
    return 'landing';
  });

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState('');

  // Authentication Modal configuration
  const [loginModal, setLoginModal] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '').trim() : '';
    const tabName = hash.split('?')[0];
    const isLogin = tabName === 'login';
    const isSignup = tabName === 'signup';
    return {
      isOpen: isLogin || isSignup,
      initialPanel: isSignup ? 'signup' : 'login',
      promptMessage: '',
    };
  });

  const handleOpenLogin = useCallback((options = {}) => {
    if (options?.promptMessage) {
      sessionStorage.setItem('c2b_loginPrompt', options.promptMessage);
    }
    if (options?.redirectAfterLogin) {
      sessionStorage.setItem('c2b_redirectAfterLogin', options.redirectAfterLogin);
    }
    setLoginModal({
      isOpen: true,
      initialPanel: options?.initialPanel || 'login',
      promptMessage: options?.promptMessage || '',
    });
  }, []);

  const handleOpenSignup = useCallback(() => {
    handleOpenLogin({ initialPanel: 'signup' });
  }, [handleOpenLogin]);

  const handleCloseLogin = useCallback(() => {
    setLoginModal((prev) => ({ ...prev, isOpen: false, promptMessage: '' }));
    const curHash = window.location.hash || '';
    if (curHash.includes('login') || curHash.includes('signup')) {
      window.location.hash = activeTab === 'landing' ? '' : `#${activeTab}`;
    }
  }, [activeTab]);

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('c2b_notifications');
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Global Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const notifiedTripsRef = useRef(
    new Set(
      (() => {
        try {
          return JSON.parse(sessionStorage.getItem('c2b_customer_notified_trips') || '[]');
        } catch {
          return [];
        }
      })()
    )
  );

  // Watch for bus trips starting (departure time arrived or provider started trip) and alert customer
  useEffect(() => {
    const checkTripStatuses = () => {
      try {
        const localBookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        const rawStatuses = localStorage.getItem('c2b_trip_statuses');
        const statuses = rawStatuses ? JSON.parse(rawStatuses) : {};
        const schedules = JSON.parse(localStorage.getItem('c2b_bus_schedules') || '[]');
        let statusesChanged = false;

        localBookings.forEach((b) => {
          if (b.status === 'CANCELLED') return;
          const tid = b.tripId || b.scheduleId || b.id;
          if (!tid) return;

          const sched = schedules.find((s) => s.id === tid || s.tripId === tid);
          const jDate = b.date || b.journeyDate || sched?.journeyDate;
          const depTime = b.departureTime || sched?.departureTime;

          const curStatus = statuses[tid] || b.tripStatus || 'SCHEDULED';
          const timePassed = isDepartureTimeReached(jDate, depTime);

          if ((curStatus === 'SCHEDULED' || !statuses[tid]) && timePassed) {
            statuses[tid] = 'IN_PROGRESS';
            statusesChanged = true;
          }

          const isStarted = statuses[tid] === 'IN_PROGRESS' || timePassed;

          if (isStarted && !notifiedTripsRef.current.has(tid)) {
            notifiedTripsRef.current.add(tid);
            try {
              const saved = JSON.parse(sessionStorage.getItem('c2b_customer_notified_trips') || '[]');
              if (!saved.includes(tid)) saved.push(tid);
              sessionStorage.setItem('c2b_customer_notified_trips', JSON.stringify(saved));
            } catch {}

            const busTitle = b.busName || sched?.busName || 'Your bus';
            const routeText = `${b.from || sched?.from || 'Origin'} → ${b.to || sched?.to || 'Destination'}`;

            showToast(`🚌 ${busTitle} (${routeText}) has started its journey!`, 'success');

            const newNotif = {
              id: `trip_start_${tid}_${Date.now()}`,
              title: '🚌 Bus Has Started!',
              desc: `${busTitle} (${routeText}) has departed at ${depTime || 'scheduled time'}.`,
              time: 'Just now',
              type: 'success',
              read: false,
              unread: true,
            };

            setNotifications((prev) => {
              const exists = prev.some((n) => typeof n.id === 'string' && n.id.startsWith(`trip_start_${tid}`));
              if (exists) return prev;
              const nextNotifs = [newNotif, ...prev];
              try {
                localStorage.setItem('c2b_notifications', JSON.stringify(nextNotifs));
              } catch {}
              return nextNotifs;
            });
          }
        });

        if (statusesChanged) {
          localStorage.setItem('c2b_trip_statuses', JSON.stringify(statuses));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (err) {
        console.error('Error checking trip statuses in customer app:', err);
      }
    };

    checkTripStatuses();
    const interval = setInterval(checkTripStatuses, 4000);

    const handleStorage = (e) => {
      if (!e || !e.key || e.key === 'c2b_trip_statuses' || e.key === 'c2b_bus_schedules' || e.key === 'c2b_bookings') {
        checkTripStatuses();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [showToast]);

  // Real-time cross-actor synchronization (Service Provider, Admin, Super Admin)
  useEffect(() => {
    liveSync.init();
    const unsubscribe = liveSync.subscribe((event) => {
      if (event.type === 'TRIP_STATUS_UPDATED') {
        const { tripId, status } = event.payload || {};
        if (status === 'IN_PROGRESS' && tripId && !notifiedTripsRef.current.has(tripId)) {
          notifiedTripsRef.current.add(tripId);
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
  }, [showToast]);

  // Hash Routing Synchronization with Route Guards
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const tabName = hash.split('?')[0];

      if (!tabName || tabName === 'landing' || tabName === 'home') {
        setActiveTab('landing');
        return;
      }

      if (tabName === 'login') {
        handleOpenLogin({ initialPanel: 'login' });
        return;
      }

      if (tabName === 'signup') {
        handleOpenLogin({ initialPanel: 'signup' });
        return;
      }

      if (PROTECTED_TABS.includes(tabName) && (!user || !user.isLoggedIn)) {
        const msg = tabName === 'get-support'
          ? 'Please sign in to access customer support.'
          : 'Please sign in to access your account.';
        showToast(msg, 'info');
        handleOpenLogin({
          promptMessage: msg,
          redirectAfterLogin: `#${tabName}`,
        });
        setActiveTab('landing');
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
        setActiveTab(tabName);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, handleOpenLogin, showToast]);

  // Restore intended redirect destination after login
  useEffect(() => {
    if (user && user.isLoggedIn) {
      // 1. Pending booking takes strict precedence over any stale redirects
      const hasPendingBooking =
        sessionStorage.getItem('c2b_pendingBooking') ||
        sessionStorage.getItem('c2b_proceedToPassenger') === 'true' ||
        sessionStorage.getItem('c2b_returnAfterLogin') === 'passenger';

      if (hasPendingBooking) {
        sessionStorage.removeItem('c2b_redirectAfterLogin');
        setActiveTab('search-trips');
        window.location.hash = '#search-trips';
        return;
      }

      // 2. Otherwise restore protected destination (e.g. user specifically requested Support or Bookings)
      const redirectTarget = sessionStorage.getItem('c2b_redirectAfterLogin');
      if (redirectTarget) {
        sessionStorage.removeItem('c2b_redirectAfterLogin');
        const cleanTab = redirectTarget.replace('#', '').split('?')[0];
        if (cleanTab) {
          setActiveTab(cleanTab);
          window.location.hash = redirectTarget;
        }
      }
    }
  }, [user]);

  const handleNavigate = (tab, params = {}) => {
    if (PROTECTED_TABS.includes(tab) && (!user || !user.isLoggedIn)) {
      const msg = tab === 'get-support'
        ? 'Please sign in to access customer support.'
        : 'Please sign in to access your account.';
      showToast(msg, 'info');
      handleOpenLogin({
        promptMessage: msg,
        redirectAfterLogin: `#${tab}`,
      });
      return;
    }

    if (params.booking) {
      setSelectedBookingForCancel(params.booking);
    }
    if (params.bookingId) {
      setSelectedBookingForRefund(params.bookingId);
    }
    setActiveTab(tab);
    window.location.hash = tab === 'landing' ? '' : `#${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // User Profile Updates
  const handleUpdateUser = (updatedUser) => {
    const fullUser = { ...user, ...updatedUser, isLoggedIn: true };
    setUser(fullUser);
    if (updatedUser.name) {
      localStorage.setItem('c2b_userName', updatedUser.name);
      sessionStorage.setItem('c2b_userName', updatedUser.name);
    }
    if (updatedUser.email) {
      localStorage.setItem('c2b_userEmail', updatedUser.email);
      sessionStorage.setItem('c2b_userEmail', updatedUser.email);
    }
    if (updatedUser.phone) {
      localStorage.setItem('c2b_userPhone', updatedUser.phone);
      sessionStorage.setItem('c2b_userPhone', updatedUser.phone);
    }
    if (updatedUser.avatar) {
      localStorage.setItem('c2b_user_avatar', updatedUser.avatar);
      sessionStorage.setItem('c2b_user_avatar', updatedUser.avatar);
    }
  };

  // Login handler
  const handleLoginSuccess = (loggedInUser) => {
    const fullUser = { ...loggedInUser, isLoggedIn: true };
    setUser(fullUser);
    setLoginModal({ isOpen: false, initialPanel: 'login', promptMessage: '' });

    const curHash = window.location.hash || '';
    if (curHash.includes('login') || curHash.includes('signup') || !curHash || curHash === '#' || curHash === '#landing') {
      const redirect = sessionStorage.getItem('c2b_redirectAfterLogin') || '#search-trips';
      sessionStorage.removeItem('c2b_redirectAfterLogin');
      const targetTab = redirect.replace('#', '').split('?')[0] || 'search-trips';
      setActiveTab(targetTab);
      window.location.hash = redirect;
    }
    showToast(`👋 Welcome back, ${loggedInUser.name.split(' ')[0]}!`, 'success');
  };

  // Logout handler — clears session and returns to public landing page
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout from Click2Book?')) {
      sessionStorage.removeItem('c2b_loggedIn');
      sessionStorage.removeItem('c2b_loggedInId');
      sessionStorage.removeItem('c2b_userName');
      sessionStorage.removeItem('c2b_userEmail');
      sessionStorage.removeItem('c2b_userPhone');
      sessionStorage.removeItem('c2b_user_avatar');
      sessionStorage.removeItem('c2b_role');
      sessionStorage.removeItem('c2b_userId');
      localStorage.removeItem('c2b_loggedIn');
      localStorage.removeItem('c2b_loggedInId');
      localStorage.removeItem('c2b_userName');
      localStorage.removeItem('c2b_userEmail');
      localStorage.removeItem('c2b_userPhone');
      localStorage.removeItem('c2b_user_avatar');
      localStorage.removeItem('c2b_role');
      localStorage.removeItem('c2b_userId');

      setUser(null);
      showToast('👋 You have been logged out.', 'info');
      handleNavigate('landing');
    }
  };

  // Notification actions
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('c2b_notifications', JSON.stringify(updated));
    showToast('Notifications marked as read.', 'info');
  };

  const handleRemoveNotif = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('c2b_notifications', JSON.stringify(updated));
  };

  const unreadNotifsCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="customer-app-layout">
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={closeToast} />

      {/* Slide-over Notifications */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onRemoveNotification={handleRemoveNotif}
      />

      {/* Authentication Modal */}
      <Login
        isOpen={loginModal.isOpen}
        initialPanel={loginModal.initialPanel}
        promptMessage={loginModal.promptMessage}
        onClose={handleCloseLogin}
        onLoginSuccess={handleLoginSuccess}
        showToast={showToast}
      />



      {/* ─── Public Landing Page ─── */}
      {activeTab === 'landing' ? (
        <LandingPage
          user={user}
          onSearchBuses={({ from, to, date }) => {
            sessionStorage.setItem('searchFrom', from);
            sessionStorage.setItem('searchTo', to);
            sessionStorage.setItem('searchDate', date);
            sessionStorage.setItem('c2b_autoSearch', 'true');
            handleNavigate('search-trips');
          }}
          onOpenLogin={() => handleOpenLogin({ initialPanel: 'login' })}
          onOpenSignup={handleOpenSignup}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleNavigate}
            onNavigate={handleNavigate}
            customer={user}
            user={user}
            onLogout={handleLogout}
            onOpenLogin={() => handleOpenLogin({ initialPanel: 'login' })}
          />

          {/* Main Workspace */}
          <main className="main-content">
            <Header
              activeTab={activeTab}
              customer={user}
              user={user}
              unreadCount={unreadNotifsCount}
              onOpenNotifications={() => setIsNotifOpen(true)}
              onOpenNotif={() => setIsNotifOpen(true)}
              onOpenLogin={() => handleOpenLogin({ initialPanel: 'login' })}
              onNavigate={handleNavigate}
            />

            {/* Dynamic View Switcher */}
            {activeTab === 'search-trips' && (
              <SearchTrips
                customer={user}
                user={user}
                onOpenLogin={handleOpenLogin}
                onNavigate={handleNavigate}
                onNavigateToBookings={() => handleNavigate('my-bookings')}
                showToast={showToast}
              />
            )}

            {activeTab === 'my-bookings' && (
              <MyBookings
                user={user}
                customer={user}
                onNavigate={handleNavigate}
                onNavigateToCancel={(b) => handleNavigate('cancel-ticket', { booking: b })}
                onNavigateToTrackRefund={(bId) => handleNavigate('track-refunds', { bookingId: bId })}
                onNavigateToSearch={() => handleNavigate('search-trips')}
                showToast={showToast}
              />
            )}

            {activeTab === 'cancel-ticket' && (
              <CancelTicket
                user={user}
                customer={user}
                preselectedBooking={selectedBookingForCancel}
                initialBooking={selectedBookingForCancel}
                onNavigate={handleNavigate}
                onNavigateToTrackRefund={(bId) => handleNavigate('track-refunds', { bookingId: bId })}
                onBackToBookings={() => handleNavigate('my-bookings')}
                showToast={showToast}
              />
            )}

            {activeTab === 'track-refunds' && (
              <TrackRefunds
                user={user}
                customer={user}
                initialBookingId={selectedBookingForRefund}
                onNavigate={handleNavigate}
                onBackToBookings={() => handleNavigate('my-bookings')}
                showToast={showToast}
              />
            )}

            {activeTab === 'offers' && (
              <Offers
                showToast={showToast}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'get-support' && (
              <GetSupport
                user={user}
                customer={user}
                showToast={showToast}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'lost-found' && (
              <LostFound
                user={user}
                customer={user}
                showToast={showToast}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'my-profile' && (
              <MyProfile
                user={user}
                customer={user}
                onUpdateUser={handleUpdateUser}
                onNavigate={handleNavigate}
                showToast={showToast}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
