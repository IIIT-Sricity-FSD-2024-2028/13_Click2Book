import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { liveSync } from './lib/liveSync';
import { navigateAndClearTransientThunk } from './store/actions';
import PlatformBanner from './components/PlatformBanner';
import StaffAccess from './landing/StaffAccess';
import SuperAdminConsole from './superadmin/Console';
import SuperAdminLogin from './superadmin/Login';
import SuperAdminRevenue from './superadmin/Revenue';

/**
 * Click2Book frontend entry point — Super Admin & Platform Console.
 * State is managed in Redux memory (no browser storage).
 */
export default function App() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    liveSync.init();
  }, []);

  useEffect(() => {
    dispatch(navigateAndClearTransientThunk(pathname));
  }, [pathname, dispatch]);

  return (
    <>
      <PlatformBanner />
      <Routes>
        <Route path="/" element={<StaffAccess />} />
        <Route path="/staff-access" element={<StaffAccess />} />
        <Route path="/super-admin" element={<SuperAdminConsole />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/super-admin/revenue" element={<SuperAdminRevenue />} />
      </Routes>
    </>
  );
}
