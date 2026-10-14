import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, loadAdminDashboardData } from '../../lib/api.js';
import { getUsers } from '../../lib/db.js';
import { getAdminName, initialsOf } from '../../lib/session.js';
import '../../styles/admin_dashboard.css';
import SuperUserPanel from '../../superuser/SuperUserPanel.jsx';
import BookingsSection from './BookingsSection.jsx';
import Overview from './Overview.jsx';
import RefundsSection from './RefundsSection.jsx';
import ReportsSection from './ReportsSection.jsx';
import { loadSavedSection, saveSection, SECTIONS } from './sections.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import UsersSection from './UsersSection.jsx';

export default function DashboardPage() {
  const [section, setSection] = useState(loadSavedSection);
  const [collapsed, setCollapsed] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardData, setDashboardData] = useState({ bookings: [], refunds: [], users: [], routes: [], revenueByDay: [], totalRevenue: 0, activeBuses: 0 });
  const [dataError, setDataError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef();
  const refreshPromise = useRef(null);

  const bookings = dashboardData.bookings;
  const refunds = dashboardData.refunds;
  const users = useMemo(() => [
    ...dashboardData.users,
    ...getUsers().filter((user) => user.role === 'admin' || user.role === 'support'),
  ], [dashboardData.users, refreshKey]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const refresh = useCallback(() => {
    if (refreshPromise.current) return refreshPromise.current;
    setRefreshing(true);
    refreshPromise.current = loadAdminDashboardData()
      .then((data) => {
        setDashboardData(data);
        setDataError('');
        setLastSynced(new Date());
        setRefreshKey((current) => current + 1);
        return true;
      })
      .catch((error) => {
        setDataError(`Live admin data unavailable: ${error.message}`);
        return false;
      })
      .finally(() => {
        setRefreshing(false);
        refreshPromise.current = null;
      });
    return refreshPromise.current;
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const notify = (message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };
  const navigate = (id) => {
    setSection(id);
    saveSection(id);
  };
  const runAdminAction = async (action, successMessage, fallbackError) => {
    setBusy(true);
    try {
      await action();
      await refresh();
      notify(successMessage);
    } catch (error) {
      notify(error.message || fallbackError);
    } finally {
      setBusy(false);
    }
  };

  const updateBooking = (id, status) => runAdminAction(async () => {
    if (status === 'confirmed') {
      await apiFetch(`/bookings/${id}/confirm`, { method: 'PATCH' });
    } else if (status === 'cancelled') {
      await apiFetch('/cancellations', { method: 'POST', body: JSON.stringify({ bookingId: id }) });
    } else {
      throw new Error(`Unsupported booking update: ${status}`);
    }
  }, `Booking ${id} updated.`, 'Failed to update booking.');

  const toggleUserStatus = (user) => {
    const status = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    return runAdminAction(() => apiFetch(`/customers/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }), `User ${user.id} status updated.`, 'Failed to update user status.');
  };

  const decideRefund = (refund, status) => runAdminAction(async () => {
    const adminId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'A001';
    const refundStatus = status === 'approved' ? 'COMPLETED' : 'REJECTED';
    await apiFetch(`/refunds/booking/${refund.bookingId}/process`, {
      method: 'PATCH',
      body: JSON.stringify({ adminId, refundStatus }),
    });
  }, `Refund ${refund.id} ${status}.`, 'Failed to process refund.');

  const searchBookings = (value) => {
    setBookingSearch(value);
    navigate('bookings');
  };

  const renderSection = () => {
    switch (section) {
      case 'bookings':
        return <BookingsSection bookings={bookings} search={bookingSearch} onSearchChange={setBookingSearch} onStatusChange={updateBooking} busy={busy} />;
      case 'users':
        return <UsersSection users={users} onToggleStatus={toggleUserStatus} />;
      case 'refund':
        return <RefundsSection refunds={refunds} onDecision={decideRefund} busy={busy} />;
      case 'reports':
        return <ReportsSection bookings={bookings} refunds={refunds} users={users} routes={dashboardData.routes} totalRevenue={dashboardData.totalRevenue} />;
      default:
        return <Overview bookings={bookings} users={users} totalRevenue={dashboardData.totalRevenue} revenueByDay={dashboardData.revenueByDay} activeBuses={dashboardData.activeBuses} onViewAll={() => navigate('bookings')} />;
    }
  };

  const title = (SECTIONS.find(([id]) => id === section) || SECTIONS[0])[2];
  const adminName = getAdminName();
  const initials = initialsOf(adminName) || 'AD';

  return (
    <div className="admin-shell">
      <Sidebar
        section={section}
        collapsed={collapsed}
        adminName={adminName}
        initials={initials}
        onNavigate={navigate}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Topbar title={title} initials={initials} onSearch={searchBookings} onNotify={notify} onRefresh={refresh} refreshing={refreshing} lastSynced={lastSynced} hasSyncError={Boolean(dataError)} />
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
