import React, { useState, useEffect } from 'react';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RevenuePage from './pages/RevenuePage.jsx';
import SuperUserLoginPage from './pages/SuperUserLoginPage.jsx';
import { clearAdminSession, isAdminLoggedIn } from './lib/session.js';
import { saveSection } from './pages/dashboard/sections.js';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(isAdminLoggedIn);

  const getInitialRoute = () => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash.includes('superuser') || path.includes('super-user-login')) {
      return 'super-user-login';
    }
    // If user is logged in and requested revenue
    if (isAdminLoggedIn()) {
      if (hash.includes('revenue') || path.includes('revenue')) return 'revenue';
      return 'dashboard';
    }
    // Default when not logged in is always login
    return 'login';
  };

  const [route, setRoute] = useState(getInitialRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const authed = isAdminLoggedIn();
      setIsLoggedIn(authed);

      if (hash.includes('superuser') || path.includes('super-user-login')) {
        setRoute('super-user-login');
      } else if (!authed) {
        setRoute('login');
      } else if (hash.includes('revenue') || path.includes('revenue')) {
        setRoute('revenue');
      } else {
        setRoute('dashboard');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    saveSection('dashboard');
    setIsLoggedIn(true);
    setRoute('dashboard');
    window.location.hash = '#dashboard';
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
    setRoute('login');
    window.location.hash = '#login';
  };

  const handleNavigateToRevenue = () => {
    setRoute('revenue');
    window.location.hash = '#revenue';
  };

  const handleNavigateToDashboard = () => {
    setRoute('dashboard');
    window.location.hash = '#dashboard';
  };

  return (
    <div className="admin-app-root">
      {/* If not logged in, enforce login screen */}
      {!isLoggedIn && route !== 'super-user-login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}

      {route === 'super-user-login' && (
        <SuperUserLoginPage />
      )}

      {/* Authenticated routes */}
      {isLoggedIn && route === 'dashboard' && (
        <DashboardPage
          onLogout={handleLogout}
          onViewRevenue={handleNavigateToRevenue}
        />
      )}

      {isLoggedIn && route === 'revenue' && (
        <RevenuePage
          onBack={handleNavigateToDashboard}
        />
      )}
    </div>
  );
}
