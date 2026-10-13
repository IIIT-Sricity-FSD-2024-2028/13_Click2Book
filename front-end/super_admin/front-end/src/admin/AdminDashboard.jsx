import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useToast from '../hooks/useToast';
import SourceBadge from '../components/SourceBadge';
import SearchSuggest from '../components/SearchSuggest/SearchSuggest';
import { getSessionValue, getUserName, initials } from '../lib/session';
import { loadAdminData } from './lib/adminData';
import { ROLE_DEFAULTS } from './sections/Admins';
import Overview from './sections/Overview';
import Bookings from './sections/Bookings';
import Customers from './sections/Customers';
import Providers from './sections/Providers';
import Buses from './sections/Buses';
import Admins from './sections/Admins';
import Reports from './sections/Reports';
import Finance from './sections/Finance';
import Support from './sections/Support';
import Settings from './sections/Settings';
import './styles/admin-dashboard.css';
import './styles/admin-console.css';

const Icon = ({ children }) => (
  <svg
    className="nav-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** id → [title, subtitle, required permission, icon, component] */
const SECTIONS = {
  dashboard: [
    'Dashboard Overview',
    'Live summary of bookings, revenue and operations',
    null,
    <Icon key="i">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </Icon>,
    Overview,
  ],
  admins: [
    'Admin Management',
    'Admin accounts, roles, permissions and activity',
    'MANAGE_ADMINS',
    <Icon key="i">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Icon>,
    Admins,
  ],
  providers: [
    'Service Providers',
    'Verify documents, approve, reject or suspend operators',
    'MANAGE_PROVIDERS',
    <Icon key="i">
      <rect x="1" y="3" width="22" height="13" rx="2" />
      <path d="M5 20h14M8 17v3M16 17v3" />
    </Icon>,
    Providers,
  ],
  buses: [
    'Buses',
    'Every bus registered by operators',
    'MANAGE_PROVIDERS',
    <Icon key="i">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M3 11h18M7 21v-4M17 21v-4" />
    </Icon>,
    Buses,
  ],
  bookings: [
    'Bookings',
    'Every booking on the platform — search, filter, cancel',
    'MANAGE_BOOKINGS',
    <Icon key="i">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 3H8l-2 4h12l-2-4z" />
    </Icon>,
    Bookings,
  ],
  customers: [
    'Customers',
    'Registered customer accounts',
    'MANAGE_CUSTOMERS',
    <Icon key="i">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </Icon>,
    Customers,
  ],
  reports: [
    'Analytics & Reports',
    'Bookings, cancellations, revenue and commission — daily and monthly',
    'VIEW_REPORTS',
    <Icon key="i">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </Icon>,
    Reports,
  ],
  finance: [
    'Finance',
    'Commission, payments, refunds and operator payouts',
    'MANAGE_FINANCE',
    <Icon key="i">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>,
    Finance,
  ],
  support: [
    'Support Oversight',
    'Complaints, escalations, SOS alerts and team performance',
    'MANAGE_SUPPORT',
    <Icon key="i">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Icon>,
    Support,
  ],
  settings: [
    'Platform Settings',
    'Booking & cancellation policy, refund rules, fees, notifications, security',
    'MANAGE_SETTINGS',
    <Icon key="i">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>,
    Settings,
  ],
};

/**
 * Search suggestions for the topbar box. A suggestion matches on the record's
 * name only; records without a name (bookings, payments, …) match on their ID.
 * Picking one puts that name/ID in the box, which every section's table filter covers.
 */
function searchItems(section, data) {
  if (!data) return [];
  const item = (tag, id, name) => {
    const label = String(name || id);
    return { key: tag + id, tag, label, sub: name ? id : '', value: label, fields: [label] };
  };
  const bookings = () => data.bookings.map((b) => item('Booking', b.id));

  switch (section) {
    case 'dashboard':
    case 'bookings':
      return bookings();
    case 'customers':
      return data.customers.map((c) => item('Customer', c.id, c.name));
    case 'providers':
      return data.providers.map((p) => item('Provider', p.id, p.name));
    case 'buses':
      return data.vehicles.map((v) => item('Bus', v.vehicleId, v.busName));
    case 'admins':
      return data.admins.map((a) => item('Admin', a.adminId, a.name));
    case 'finance':
      return [...data.rawPayments.map((p) => item('Payment', p.paymentId)), ...data.refunds.map((r) => item('Refund', r.bookingId))];
    case 'support':
      return [
        ...data.requests.map((r) => item('Request', r.requestId)),
        ...data.emergencies.map((e) => item('SOS', e.alertId)),
        ...data.tickets.map((t) => item('Ticket', t.ticketId)),
      ];
    case 'reports':
      return data.reports.map((r) => item('Report', r.reportDate));
    default:
      return [];
  }
}

const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', FINANCE: 'Finance', SUPPORT_LEAD: 'Support Lead' };

/** Role + permissions saved at login; the super-user session gets everything. */
function readAccess() {
  const role = getSessionValue('c2b_adminRole') || 'SUPER_ADMIN';
  let permissions = null;
  try {
    permissions = JSON.parse(getSessionValue('c2b_adminPermissions') || 'null');
  } catch {
    /* ignore */
  }
  return { role, permissions: role === 'SUPER_ADMIN' ? ROLE_DEFAULTS.SUPER_ADMIN : permissions || ROLE_DEFAULTS[role] || [] };
}

/** Closes a dropdown when clicking outside `ref`. */
function useOutsideClose(ref, open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, open, close]);
}

export default function AdminDashboard() {
  usePageTitle('Admin Console – Click2Book');
  const navigate = useNavigate();
  const signedIn = getSessionValue('c2b_role') === 'ADMIN';
  const [access] = useState(readAccess);
  const can = useCallback((id) => !SECTIONS[id]?.[2] || access.permissions.includes(SECTIONS[id][2]), [access]);

  const [adminName] = useState(() => getUserName('Admin'));
  const adminInitials = initials(adminName, 'AD');
  const adminId = getSessionValue('c2b_loggedInId') || 'A001';
  const adminEmail = getSessionValue('c2b_userEmail') || 'admin@click2book.com';
  const [section, setSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const [toast, showToast] = useToast(3500);
  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useOutsideClose(notifRef, notifOpen, closeNotif);
  useOutsideClose(menuRef, menuOpen, closeMenu);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadAdminData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) refresh();
  }, [refresh, signedIn]);

  const open = useCallback(
    (id) => {
      if (!can(id)) return;
      setSection(id);
      setQuery('');
      setNotifOpen(false);
      setMenuOpen(false);
    },
    [can],
  );

  const live = data?.source === 'live';

  /** Run a backend action, then reload everything. Resolves true on success. */
  const act = async (id, label, fn, confirmText) => {
    if (!live) {
      showToast('Backend is offline — changes need the API server.', 'error');
      return false;
    }
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(id);
    try {
      await fn();
      showToast(label, 'success');
      await refresh();
      return true;
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
      return false;
    } finally {
      setBusy('');
    }
  };

  const doLogout = (e) => {
    e?.preventDefault();
    if (!window.confirm('Are you sure you want to logout?')) return;
    for (const store of [sessionStorage, localStorage]) {
      ['c2b_loggedIn', 'c2b_role', 'c2b_userName', 'c2b_userEmail', 'c2b_loggedInId', 'c2b_adminRole', 'c2b_adminPermissions'].forEach(
        (k) => store.removeItem(k),
      );
    }
    navigate('/admin/login');
  };

  if (!signedIn) return <Navigate to="/admin/login" replace />;

  const [title, subtitle, , , Section] = SECTIONS[section];
  const s = data?.stats;
  const q = query.trim().toLowerCase();
  const searchIndex = searchItems(section, data);

  const notifications = data
    ? [
        ...data.emergencies
          .filter((e) => e.status !== 'RESOLVED')
          .map((e) => ({ key: 'e' + e.alertId, icon: '🚨', text: `SOS ${e.type} on booking ${e.bookingId}`, to: 'support' })),
        ...data.requests
          .filter((r) => r.status === 'ESCALATED')
          .map((r) => ({ key: 'x' + r.requestId, icon: '⬆️', text: `Escalated: ${r.requestId}`, to: 'support' })),
        ...data.providers
          .filter((p) => p.status === 'pending')
          .map((p) => ({ key: 'p' + p.id, icon: '🚌', text: `${p.name} is waiting for approval`, to: 'providers' })),
        ...data.refunds
          .filter((r) => r.refundStatus === 'REQUESTED')
          .map((r) => ({ key: 'f' + r.bookingId, icon: '↩️', text: `Refund requested for ${r.bookingId}`, to: 'finance' })),
        ...data.requests
          .filter((r) => r.status === 'OPEN')
          .map((r) => ({ key: 'r' + r.requestId, icon: '💬', text: `${r.requestId}: ${r.description.slice(0, 48)}`, to: 'support' })),
      ].filter((n) => can(n.to))
    : [];

  const navBadge = s ? { providers: s.pendingProviders, support: s.openRequests + s.openEmergencies, finance: s.pendingRefunds } : {};
  const ctx = { data, q, act, busy, live, open, can, setQuery, showToast, adminId, adminEmail };

  return (
    <div className="pg-admin-admin-dashboard css-admin-dashboard">
      {/* ===== SIDEBAR ===== */}
      <aside className={'sidebar' + (collapsed ? ' collapsed' : '')} id="sidebar">
        <div className="sidebar-brand">
          <Link to="/" title="Go to home page" style={{ display: 'contents', textDecoration: 'none', color: 'inherit' }}>
            <div className="brand-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F97316"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">{access.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Console'}</span>{' '}
              <span className="brand-sub">Click2Book</span>
            </div>
          </Link>
          <button className="sidebar-toggle" id="sidebarToggle" aria-label="Toggle Sidebar" onClick={() => setCollapsed((c) => !c)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <div className="admin-card">
          <div className="admin-avatar" id="sidebarAvatar">
            {adminInitials}
          </div>
          <div className="admin-info">
            <span className="admin-name" id="sidebarName">
              {adminName}
            </span>{' '}
            <span className="admin-role" id="sidebarRole">
              {ROLE_LABEL[access.role] || access.role}
            </span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(SECTIONS)
            .filter(([id]) => can(id))
            .map(([id, [label, , , icon]]) => (
              <a
                key={id}
                href="#"
                className={'nav-item' + (section === id ? ' active' : '')}
                id={`nav-${id}`}
                title={label}
                onClick={(e) => {
                  e.preventDefault();
                  open(id);
                }}
              >
                {icon} <span>{id === 'dashboard' ? 'Dashboard' : label}</span>
                {navBadge[id] > 0 && <span className="nav-badge">{navBadge[id]}</span>}
              </a>
            ))}
          {can('reports') && (
            <Link to="/admin/revenue-dashboard" className="nav-item" id="nav-revenue" title="Revenue split dashboard">
              <Icon>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10H12z" />
              </Icon>{' '}
              <span>Revenue Split</span>
            </Link>
          )}
        </nav>
        <div className="sidebar-spacer" />
        <nav className="sidebar-nav sidebar-nav-bottom">
          <a href="#" className="nav-item nav-logout logout-btn" id="logoutBtn" onClick={doLogout}>
            <Icon>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </Icon>{' '}
            <span>Logout</span>
          </a>
        </nav>
      </aside>

      {/* ===== MAIN ===== */}
      <main className={'main-content' + (collapsed ? ' expanded' : '')} id="mainContent">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title" id="pageTitle">
              {title}
            </h1>
            <p className="page-subtitle" id="pageSubtitle">
              {subtitle}
            </p>
          </div>
          <div className="topbar-right">
            {section !== 'settings' && (
              <SearchSuggest
                className="topbar-search"
                inputId="globalSearch"
                value={query}
                onChange={setQuery}
                items={searchIndex}
                placeholder={section === 'dashboard' ? 'Search recent bookings…' : `Search ${title.toLowerCase()}…`}
              />
            )}
            <button
              className="topbar-btn"
              id="refreshBtn"
              aria-label="Refresh data"
              title="Refresh data"
              onClick={refresh}
              disabled={loading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={loading ? 'spin' : ''}
              >
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
            <div className="dropdown-anchor" ref={notifRef}>
              <button className="topbar-btn notif-btn" id="notifBtn" aria-label="Notifications" onClick={() => setNotifOpen((o) => !o)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifications.length > 0 && <span className="notif-count">{notifications.length}</span>}
              </button>
              {notifOpen && (
                <div className="dropdown" id="notifPanel">
                  <div className="dropdown-head">Needs your attention</div>
                  {notifications.length === 0 ? (
                    <div className="dropdown-empty">You're all caught up ✅</div>
                  ) : (
                    notifications.slice(0, 12).map((n) => (
                      <button key={n.key} className="dropdown-item" onClick={() => open(n.to)}>
                        <span>{n.icon}</span> <span>{n.text}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="dropdown-anchor" ref={menuRef}>
              <button className="topbar-avatar" id="topbarAvatar" aria-label="Admin menu" onClick={() => setMenuOpen((o) => !o)}>
                {adminInitials}
              </button>
              {menuOpen && (
                <div className="dropdown" id="adminMenu">
                  <div className="dropdown-head">
                    {adminName}
                    <small>
                      {adminEmail} · {ROLE_LABEL[access.role] || access.role}
                    </small>
                  </div>
                  {can('settings') && (
                    <button className="dropdown-item" onClick={() => open('settings')}>
                      ⚙️ Platform settings
                    </button>
                  )}
                  {can('reports') && (
                    <Link className="dropdown-item" to="/admin/revenue-dashboard">
                      💰 Revenue split dashboard
                    </Link>
                  )}
                  <button className="dropdown-item danger" onClick={doLogout}>
                    ⎋ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!data ? (
          <div className="dashboard-body">
            <div className="loading-card">Loading admin data…</div>
          </div>
        ) : (
          <div className="dashboard-body page-section" id={`section-${section}`}>
            {data.source === 'offline' && (
              <div className="offline-banner">⚠️ Backend offline — showing local demo data. Changes need the API server (port 3000).</div>
            )}
            <Section key={section} ctx={ctx} />
          </div>
        )}
      </main>

      <SourceBadge tone={!data ? 'loading' : live ? 'live' : 'error'}>
        {!data
          ? '⏳ Loading…'
          : live
            ? `🟢 Backend Live — ${s.totalBookings} bookings · ${s.activeBuses} buses · ${s.openRequests} open complaints${data.partial ? ' (some data missing)' : ''}`
            : '🔴 Backend offline — showing local data'}
      </SourceBadge>
      {toast && (
        <div id="adminToast" className={`admin-toast ${toast.type}`} style={{ opacity: toast.visible ? 1 : 0 }}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
