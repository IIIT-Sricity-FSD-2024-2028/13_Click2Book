import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/admin_dashboard.css';
import SuperUserPanel from './SuperUserPanel.jsx';
import BookingsSection from './BookingsSection.jsx';
import CouponsSection from './CouponsSection.jsx';
import Overview from './Overview.jsx';
import ProvidersSection from './ProvidersSection.jsx';
import RefundsSection from './RefundsSection.jsx';
import ReportsSection from './ReportsSection.jsx';
import SupportSection from './SupportSection.jsx';
import LocationsSection from './LocationsSection.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import UsersSection from './UsersSection.jsx';
import {
  loadAdminDashboardThunk,
  runAdminActionThunk,
  updateBookingStatusThunk,
  toggleUserStatusThunk,
  decideRefundThunk,
  navigateSectionThunk,
  setBookingSearch,
} from '../store/actions';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const section = useSelector((state) => state.ui.section);
  const collapsed = useSelector((state) => state.ui.collapsed);
  const dataError = useSelector((state) => state.ui.dataError);
  const busy = useSelector((state) => state.ui.busy);
  const toast = useSelector((state) => state.ui.toast);

  const bookingSearch = useSelector((state) => state.bookings.search);
  const bookings = useSelector((state) => state.bookings.items);
  const refunds = useSelector((state) => state.refunds.items);
  const users = useSelector((state) => state.users.items);
  const dashboardData = useSelector((state) => state.reports.dashboardMetrics);

  const refresh = useCallback(() => dispatch(loadAdminDashboardThunk()), [dispatch]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15000);
    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refresh]);

  const navigate = (id) => dispatch(navigateSectionThunk(id));
  const runAdminAction = (action, successMessage, fallbackError) =>
    dispatch(runAdminActionThunk(action, successMessage, fallbackError));

  const updateBooking = (id, status) => dispatch(updateBookingStatusThunk({ id, status }));
  const toggleUserStatus = (user) => dispatch(toggleUserStatusThunk(user));
  const decideRefund = (refund, status) => dispatch(decideRefundThunk({ refund, status }));

  const renderSection = () => {
    switch (section) {
      case 'bookings':
        return (
          <BookingsSection
            bookings={bookings}
            search={bookingSearch}
            onSearchChange={(val) => dispatch(setBookingSearch(val))}
            onStatusChange={updateBooking}
            busy={busy}
          />
        );
      case 'users':
        return <UsersSection users={users} onToggleStatus={toggleUserStatus} busy={busy} />;
      case 'providers':
        return <ProvidersSection onAction={runAdminAction} busy={busy} />;
      case 'support':
        return <SupportSection onAction={runAdminAction} busy={busy} />;
      case 'refund':
        return <RefundsSection refunds={refunds} onDecision={decideRefund} busy={busy} />;
      case 'coupons':
        return <CouponsSection onDataChange={refresh} />;
      case 'locations':
        return <LocationsSection onAction={runAdminAction} busy={busy} />;
      case 'reports':
        return (
          <ReportsSection
            bookings={bookings}
            refunds={refunds}
            users={users}
            routes={dashboardData.routes}
            totalRevenue={dashboardData.totalRevenue}
          />
        );
      default:
        return (
          <Overview
            bookings={bookings}
            users={users}
            metrics={dashboardData}
            totalRevenue={dashboardData.totalRevenue}
            revenueByDay={dashboardData.revenueByDay}
            activeBuses={dashboardData.activeBuses}
            onViewAll={() => navigate('bookings')}
          />
        );
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Topbar />
        <div className="dashboard-body">
          {dataError && <p className="admin-notice" role="alert">{dataError}</p>}
          {renderSection()}
        </div>
        {toast && <div className="admin-toast" role="status">{toast}</div>}
      </main>
      <SuperUserPanel actorLabel="Super User Portal" onDataChange={() => refresh()} />
    </div>
  );
}
