import { Navigate, Route, Routes } from 'react-router-dom';
import PlatformBanner from './components/PlatformBanner';

import StaffAccess from './landing/StaffAccess';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/AdminDashboard';
import AdminRevenueDashboard from './admin/RevenueDashboard';
import SuperAdminLogin from './superadmin/Login';
import SuperAdminConsole from './superadmin/Console';

/**
 * Click2Book — Super Admin + Admin portals (standalone copy).
 *
 * Same pages and URLs as the main app. Links to the customer, provider and
 * support portals (which are not part of this copy) land back on Staff Access.
 */
export default function App() {
  return (
    <>
      <PlatformBanner />
      <Routes>
        <Route path="/" element={<Navigate to="/staff-access" replace />} />
        <Route path="/staff-access" element={<StaffAccess />} />

        {/* Admin console */}
        <Route path="/admin">
          <Route index element={<Navigate to="/admin/login" replace />} />
          <Route path="login" element={<AdminLogin />} />
          <Route path="admin-dashboard" element={<AdminDashboard />} />
          <Route path="revenue-dashboard" element={<AdminRevenueDashboard />} />
          <Route path="super-user-login" element={<Navigate to="/super-admin/login" replace />} />
        </Route>

        {/* Super Admin portal */}
        <Route path="/super-admin">
          <Route index element={<SuperAdminConsole />} />
          <Route path="login" element={<SuperAdminLogin />} />
        </Route>

        {/* Other portals are not part of this copy */}
        <Route path="*" element={<Navigate to="/staff-access" replace />} />
      </Routes>
    </>
  );
}
