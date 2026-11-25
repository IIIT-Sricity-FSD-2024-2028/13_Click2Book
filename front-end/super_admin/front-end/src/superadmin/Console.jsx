import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { AdminSuperUserPanel } from '../components/SuperUserPanel/portals';
import { logoutSuperAdminThunk } from '../store/actions';

const LINKS = [{ label: '💰 Revenue', to: '/super-admin/revenue' }];

/**
 * Super Admin portal: the platform-wide data console (every table, add / edit /
 * delete records, reset the demo database) as its own full page, plus the
 * Revenue page. Reached from Staff Access → Super Admin; separate from the Admin console.
 */
export default function Console() {
  usePageTitle('Super Admin – Click2Book');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.superUserAuth);

  if (!isAuthenticated) return <Navigate to="/super-admin/login" replace />;

  const logout = () => {
    if (!window.confirm('Log out of the Super Admin portal?')) return;
    dispatch(logoutSuperAdminThunk());
    navigate('/staff-access');
  };

  return <AdminSuperUserPanel alwaysOpen hideToggle onClose={logout} links={LINKS} />;
}
