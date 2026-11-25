import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from './components/DashboardPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import RevenuePage from './components/RevenuePage.jsx';
import SuperUserLoginPage from './components/SuperUserLoginPage.jsx';
import { setRoute } from './store/actions';

export default function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const route = useSelector((state) => state.auth.route);

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash.includes('superuser') || path.includes('super-user-login')) {
        dispatch(setRoute('super-user-login'));
      } else if (!isLoggedIn) {
        dispatch(setRoute('login'));
      } else if (hash.includes('revenue') || path.includes('revenue')) {
        dispatch(setRoute('revenue'));
      } else {
        dispatch(setRoute('dashboard'));
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [isLoggedIn, dispatch]);

  return (
    <div className="admin-app-root">
      {!isLoggedIn && route !== 'super-user-login' && <LoginPage />}
      {route === 'super-user-login' && <SuperUserLoginPage />}
      {isLoggedIn && route === 'dashboard' && <DashboardPage />}
      {isLoggedIn && route === 'revenue' && <RevenuePage />}
    </div>
  );
}
