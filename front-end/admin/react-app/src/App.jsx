import { useState, useEffect } from 'react';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RevenuePage from './pages/RevenuePage.jsx';
import SuperUserLoginPage from './pages/SuperUserLoginPage.jsx';

export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login') && !hash.includes('super')) return 'login';
    if (hash.includes('revenue')) return 'revenue';
    if (hash.includes('super')) return 'superuser';
    return 'dashboard';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('login') && !hash.includes('super')) setRoute('login');
      else if (hash.includes('revenue')) setRoute('revenue');
      else if (hash.includes('super')) setRoute('superuser');
      else setRoute('dashboard');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'login') return <LoginPage />;
  if (route === 'revenue') return <RevenuePage />;
  if (route === 'superuser') return <SuperUserLoginPage />;
  return <DashboardPage />;
}
