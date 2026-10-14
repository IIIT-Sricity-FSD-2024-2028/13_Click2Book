import React, { useState, useEffect, useCallback } from 'react';
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
import TrackBus from './components/TrackBus';
import { INITIAL_NOTIFICATIONS } from './services/mockData';

const PROTECTED_TABS = ['my-bookings', 'cancel-ticket', 'my-profile', 'get-support'];

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
      'track-bus',
    ];

    if (tabName && validTabs.includes(tabName)) {
      return tabName;
    }
    return 'landing';
  });

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState('');
  const [selectedTripForTrack, setSelectedTripForTrack] = useState(null);

  // Authentication Modal configuration
  const [loginModal, setLoginModal] = useState({
    isOpen: false,
    initialPanel: 'login',
    promptMessage: '',
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
  }, []);

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

  // Hash Routing Synchronization with Route Guards
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const tabName = hash.split('?')[0];

      if (!tabName || tabName === 'landing' || tabName === 'home') {
        setActiveTab('landing');
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
        'track-bus',
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
    if (params.tripId) {
      setSelectedTripForTrack(params.tripId);
    }

    setActiveTab(tab);
    window.location.hash = tab === 'landing' ? '' : `#${tab}${params.tripId ? `?tripId=${params.tripId}` : ''}`;
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
      ) : activeTab === 'track-bus' ? (
        <TrackBus
          tripId={selectedTripForTrack}
          onNavigate={handleNavigate}
          showToast={showToast}
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
                onNavigateToTrackBus={(tripId) => handleNavigate('track-bus', { tripId })}
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
