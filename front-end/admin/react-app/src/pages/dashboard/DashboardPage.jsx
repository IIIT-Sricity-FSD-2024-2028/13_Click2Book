import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, loadAdminDashboardData } from '../../lib/api.js';
import { getUsers } from '../../lib/db.js';
import { getAdminName, initialsOf } from '../../lib/session.js';
import '../../styles/admin_dashboard.css';
import SuperUserPanel from '../../superuser/SuperUserPanel.jsx';
import BookingsSection from './BookingsSection.jsx';
import Overview from './Overview.jsx';
import ProvidersSection from './ProvidersSection.jsx';
import RefundsSection from './RefundsSection.jsx';
import ReportsSection from './ReportsSection.jsx';
import SupportSection from './SupportSection.jsx';
import { loadSavedSection, saveSection, SECTIONS } from './sections.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import UsersSection from './UsersSection.jsx';

export default function DashboardPage({ onLogout, onViewRevenue }) {
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
    ...getUsers().filter((user) => user.role === 'admin'),
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
      return true;
    } catch (error) {
      notify(error.message || fallbackError);
      return false;
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
    if (user.status === 'active') {
      const confirmed = window.confirm(`Are you sure you want to deactivate ${user.name || user.id}? The user will be unable to log in.`);
      if (!confirmed) return;
    }
    const status = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const path = user.role === 'service_provider' ? `/providers/${user.id}/status` : `/customers/${user.id}/status`;
    return runAdminAction(() => apiFetch(path, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }), `User ${user.id} status updated to ${status.toLowerCase()}.`, 'Failed to update user status.');
  };

  const decideRefund = (refund, status) => runAdminAction(async () => {
    const adminId = sessionStorage.getItem('c2b_loggedInId') || localStorage.getItem('c2b_loggedInId') || 'A001';
    const refundStatus = status === 'approved'
      ? 'PROCESSING'
      : status === 'refunded' ? 'COMPLETED' : 'REJECTED';
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
        return <UsersSection users={users} onToggleStatus={toggleUserStatus} busy={busy} />;
      case 'providers':
        return <ProvidersSection onAction={runAdminAction} busy={busy} />;
      case 'support':
        return <SupportSection onAction={runAdminAction} busy={busy} />;
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
        onLogout={onLogout}
        onViewRevenue={onViewRevenue}
      />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Topbar
          title={title}
          initials={initials}
          onSearch={searchBookings}
          onNotify={notify}
          onRefresh={refresh}
          refreshing={refreshing}
          lastSynced={lastSynced}
          hasSyncError={Boolean(dataError)}
          onLogout={onLogout}
        />
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
