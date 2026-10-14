import { Navigate, Route, Routes } from 'react-router-dom';
import PlatformBanner from './components/PlatformBanner';

import StaffAccess from './landing/StaffAccess';
import SuperAdminLogin from './superadmin/Login';
import SuperAdminConsole from './superadmin/Console';

/**
 * Click2Book — Super Admin portal (standalone copy).
 *
 * Same pages and URLs as the main app. Links to the admin, customer, provider
 * and support portals (which are not part of this copy) land back on Staff Access.
 */
export default function App() {
  return (
    <>
      <PlatformBanner />
      <Routes>
        <Route path="/" element={<Navigate to="/staff-access" replace />} />
        <Route path="/staff-access" element={<StaffAccess />} />

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
