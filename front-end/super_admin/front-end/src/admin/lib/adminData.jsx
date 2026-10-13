/**
 * Admin read models + actions.
 *
 * `loadAdminData()` pulls every admin collection from the backend in
 * parallel and joins them (booking → trip → schedule → route, booking →
 * payment, booking → customer). If the backend is unreachable it falls back
 * to the local mock DB so the page still renders offline (read-only).
 */
import { apiRequest } from '../../lib/http';
import { localISODate } from '../../lib/dates';
import { getProviders, getRecentBookings, getUsers } from './dashboardData';

/** Which admin made a change — shown in the Super Admin activity log. */
const adminHeaders = () => ({
  'x-admin-email': sessionStorage.getItem('c2b_userEmail') || localStorage.getItem('c2b_userEmail') || 'admin',
});

const get = (path) => apiRequest(path, { role: 'ADMIN' });
const send = (path, method, body) => apiRequest(path, { role: 'ADMIN', method, body, headers: adminHeaders() });

const ENDPOINTS = {
  bookings: '/bookings',
  payments: '/payments',
  customers: '/customers',
  providers: '/providers',
  vehicles: '/vehicles',
  trips: '/trips',
  schedules: '/schedules',
  routes: '/routes',
  requests: '/support-requests',
  tickets: '/support-ticket',
  emergencies: '/emergency',
  admins: '/admin',
  reviews: '/reviews',
  refunds: '/refunds',
  cancellations: '/cancellations',
  reports: '/reports',
  payouts: '/admin/payouts/summary',
  activity: '/platform/activity?limit=200',
  staff: '/support-staff',
};
/** Endpoints that return a single object rather than a list. */
const OBJECT_ENDPOINTS = {
  revenueConfig: '/admin/revenue-config',
  ledgerSummary: '/admin/ledger/summary',
  settings: '/platform/settings',
};

const byId = (list, key) => Object.fromEntries(list.map((x) => [x[key], x]));
const isSuccess = (p) => String(p.paymentStatus).toUpperCase() === 'SUCCESS';
const net = (p) => (Number(p.amount) || 0) - (Number(p.discountAmount) || 0);

function joinBookings(raw) {
  const trips = byId(raw.trips, 'tripId');
  const schedules = byId(raw.schedules, 'scheduleId');
  const routes = byId(raw.routes, 'routeId');
  const customers = byId(raw.customers, 'customerId');
  const providers = byId(raw.providers, 'providerId');
  const payByBooking = {};
  raw.payments.forEach((p) => (payByBooking[p.bookingId] = p));

  return raw.bookings
    .map((b) => {
      const trip = trips[b.tripId];
      const sched = trip && schedules[trip.scheduleId];
      const route = sched && routes[sched.routeId];
      const pay = payByBooking[b.bookingId];
      return {
        id: b.bookingId,
        customerId: b.customerId,
        customer: customers[b.customerId]?.name || b.customerId,
        route: route ? `${route.source} → ${route.destination}` : '—',
        providerId: sched?.providerId,
        provider: (sched && providers[sched.providerId]?.name) || '—',
        tripId: b.tripId,
        seat: b.seatNumber,
        date: b.bookingDate,
        status: String(b.bookingStatus || 'PENDING').toLowerCase(),
        amount: pay ? net(pay) : 0,
        paymentStatus: pay?.paymentStatus || '—',
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
}

function joinProviders(raw, bookings) {
  const schedules = byId(raw.schedules, 'scheduleId');
  const tripProvider = Object.fromEntries(raw.trips.map((t) => [t.tripId, schedules[t.scheduleId]?.providerId]));
  const agg = {};
  const bump = (pid, key, by = 1) => {
    if (!pid) return;
    agg[pid] = agg[pid] || { trips: 0, buses: 0, bookings: 0, cancelled: 0, revenue: 0, ratingSum: 0, ratings: 0 };
    agg[pid][key] += by;
  };
  raw.trips.forEach((t) => bump(tripProvider[t.tripId], 'trips'));
  raw.vehicles.forEach((v) => bump(v.providerId, 'buses'));
  bookings.forEach((b) => {
    bump(b.providerId, 'bookings');
    if (b.status === 'cancelled') bump(b.providerId, 'cancelled');
    else bump(b.providerId, 'revenue', b.amount);
  });
  raw.reviews.forEach((r) => {
    bump(tripProvider[r.tripId], 'ratingSum', Number(r.rating) || 0);
    bump(tripProvider[r.tripId], 'ratings');
  });
  return raw.providers.map((p) => {
    const a = agg[p.providerId] || { trips: 0, buses: 0, bookings: 0, cancelled: 0, revenue: 0, ratingSum: 0, ratings: 0 };
    let status = p.approved ? 'approved' : 'pending';
    if (!p.approved && p.verificationStatus === 'REJECTED') status = 'rejected';
    else if (!p.approved && p.suspensionReason) status = 'suspended';
    return {
      id: p.providerId,
      name: p.name,
      email: p.email,
      approved: !!p.approved,
      status,
      verificationStatus: p.verificationStatus || 'PENDING',
      documents: p.documents || [],
      rejectionReason: p.rejectionReason,
      suspensionReason: p.suspensionReason,
      joined: p.joinedAt || '—',
      ...a,
      rating: a.ratings ? a.ratingSum / a.ratings : null,
      cancelRate: a.bookings ? a.cancelled / a.bookings : 0,
    };
  });
}

/** Count per weekday (Mon..Sun) across all bookings. */
function weekdayCounts(bookings) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  bookings.forEach((b) => {
    const d = new Date(`${b.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) counts[(d.getDay() + 6) % 7] += 1;
  });
  return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: counts };
}

/** Last `n` calendar months ending this month: [{ key: 'YYYY-MM', label }] */
export function lastMonths(n) {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short' }),
    });
  }
  return out;
}

/** Last `n` days ending today: [{ key: 'YYYY-MM-DD', label }] */
export function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: localISODate(d), label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) });
  }
  return out;
}

/** Successful payment totals for the last 6 calendar months. */
function monthlyRevenue(payments) {
  const months = lastMonths(6);
  const totals = Object.fromEntries(months.map((m) => [m.key, 0]));
  payments.filter(isSuccess).forEach((p) => {
    const k = String(p.paymentDate || '').slice(0, 7);
    if (k in totals) totals[k] += net(p);
  });
  return { labels: months.map((m) => m.label), values: months.map((m) => totals[m.key]) };
}

function buildStats(data) {
  const today = localISODate();
  const success = data.rawPayments.filter(isSuccess);
  const revenue = success.reduce((s, p) => s + net(p), 0);
  const approvedIds = new Set(data.providers.filter((p) => p.approved).map((p) => p.id));
  const commissionPct = Number(data.revenueConfig?.commissionPct) || 0;
  return {
    totalBookings: data.bookings.length,
    bookingsToday: data.bookings.filter((b) => b.date === today).length,
    confirmed: data.bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: data.bookings.filter((b) => b.status === 'cancelled').length,
    revenue,
    revenueToday: success.filter((p) => String(p.paymentDate).slice(0, 10) === today).reduce((s, p) => s + net(p), 0),
    commissionPct,
    // Estimated: commission % × successful payment value (the ledger holds the exact split for new bookings).
    // Exact from the transaction ledger when it has rows; otherwise rate × revenue.
    commissionExact: !!data.ledgerSummary?.count,
    commissionEstimate: data.ledgerSummary?.count ? data.ledgerSummary.platformCommission / 100 : (revenue * commissionPct) / 100,
    refunded: data.refunds.filter((r) => r.refundStatus === 'COMPLETED').reduce((s, r) => s + (Number(r.refundAmount) || 0), 0),
    pendingRefunds: data.refunds.filter((r) => r.refundStatus === 'REQUESTED' || r.refundStatus === 'PROCESSING').length,
    customers: data.customers.length,
    activeCustomers: new Set(data.bookings.filter((b) => b.status !== 'cancelled').map((b) => b.customerId)).size,
    providers: data.providers.length,
    approvedProviders: approvedIds.size,
    pendingProviders: data.providers.filter((p) => p.status === 'pending').length,
    activeBuses: data.vehicles.filter((v) => approvedIds.has(v.providerId)).length,
    totalBuses: data.vehicles.length,
    openRequests: data.requests.filter((r) => r.status !== 'RESOLVED').length,
    escalated: data.requests.filter((r) => r.status === 'ESCALATED').length,
    openTickets: data.tickets.filter((t) => t.status !== 'resolved').length,
    openEmergencies: data.emergencies.filter((e) => e.status !== 'RESOLVED').length,
    activeAdmins: data.admins.filter((a) => a.status === 'ACTIVE').length,
  };
}

export async function loadAdminData() {
  const listKeys = Object.keys(ENDPOINTS);
  const objKeys = Object.keys(OBJECT_ENDPOINTS);
  const results = await Promise.allSettled([...listKeys.map((k) => get(ENDPOINTS[k])), ...objKeys.map((k) => get(OBJECT_ENDPOINTS[k]))]);
  const failed = results.filter((r) => r.status === 'rejected');

  // Backend down (every call failed) → local mock DB.
  if (failed.length === results.length) return loadOffline();

  const value = (i) => (results[i].status === 'fulfilled' ? results[i].value : null);
  const raw = Object.fromEntries(listKeys.map((k, i) => [k, Array.isArray(value(i)) ? value(i) : []]));
  objKeys.forEach((k, j) => (raw[k] = value(listKeys.length + j)));

  const bookings = joinBookings(raw);
  const data = {
    source: 'live',
    partial: failed.length > 0,
    bookings,
    providers: joinProviders(raw, bookings),
    customers: raw.customers.map((c) => ({
      id: c.customerId,
      name: c.name,
      email: c.email,
      phone: c.phoneNumber || '—',
      gender: c.gender || '—',
      age: c.age ?? '—',
      joined: c.createdAt || '—',
      bookings: raw.bookings.filter((b) => b.customerId === c.customerId).length,
    })),
    vehicles: raw.vehicles,
    providerNames: byId(raw.providers, 'providerId'),
    customerNames: byId(raw.customers, 'customerId'),
    requests: raw.requests,
    tickets: raw.tickets,
    emergencies: raw.emergencies,
    admins: raw.admins,
    staff: raw.staff,
    reviews: raw.reviews,
    refunds: raw.refunds,
    cancellations: raw.cancellations,
    reports: raw.reports,
    payouts: raw.payouts,
    activity: raw.activity,
    revenueConfig: raw.revenueConfig,
    ledgerSummary: raw.ledgerSummary,
    settings: raw.settings,
    rawPayments: raw.payments,
    counts: { routes: raw.routes.length, trips: raw.trips.length, schedules: raw.schedules.length },
  };
  data.weekly = weekdayCounts(bookings);
  data.trend = monthlyRevenue(raw.payments);
  data.stats = buildStats(data);
  return data;
}

function loadOffline() {
  const bookings = getRecentBookings(1000).map((b) => ({ ...b, provider: '—', paymentStatus: '—', customerId: '' }));
  const providers = getProviders().map((p) => ({
    ...p,
    approved: true,
    status: 'approved',
    buses: 0,
    documents: [],
    verificationStatus: 'VERIFIED',
    bookings: 0,
    revenue: 0,
    rating: null,
    cancelRate: 0,
  }));
  const data = {
    source: 'offline',
    partial: false,
    bookings,
    providers,
    customers: [],
    vehicles: [],
    providerNames: {},
    customerNames: {},
    requests: [],
    tickets: [],
    emergencies: [],
    admins: [],
    staff: [],
    reviews: [],
    refunds: [],
    cancellations: [],
    reports: [],
    payouts: [],
    activity: [],
    revenueConfig: null,
    ledgerSummary: null,
    settings: null,
    rawPayments: bookings.map((b) => ({ amount: b.amount, paymentStatus: 'SUCCESS', paymentDate: b.date })),
    counts: { routes: 0, trips: 0, schedules: 0 },
    offlineUsers: getUsers().length,
  };
  data.weekly = weekdayCounts(bookings);
  data.trend = monthlyRevenue(data.rawPayments);
  data.stats = buildStats(data);
  return data;
}

/* ── Actions (backend only) ─────────────────────────────── */
export const adminActions = {
  // admins
  createAdmin: (body) => send('/admin', 'POST', body),
  updateAdmin: (id, body) => send(`/admin/${id}`, 'PUT', body),
  activateAdmin: (id) => send(`/admin/${id}/activate`, 'PATCH'),
  deactivateAdmin: (id) => send(`/admin/${id}/deactivate`, 'PATCH'),
  deleteAdmin: (id) => send(`/admin/${id}`, 'DELETE'),
  // providers
  approveProvider: (id) => send(`/providers/${id}/approve`, 'PATCH'),
  rejectProvider: (id, reason) => send(`/providers/${id}/reject`, 'PATCH', { reason }),
  suspendProvider: (id, reason) => send(`/providers/${id}/suspend`, 'PATCH', { reason }),
  removeProvider: (id) => send(`/providers/${id}`, 'DELETE'),
  reviewDocument: (id, index, status, note) => send(`/providers/${id}/documents/${index}`, 'PATCH', { status, ...(note ? { note } : {}) }),
  // customers & bookings
  removeCustomer: (id) => send(`/customers/${id}`, 'DELETE'),
  cancelBooking: (id) => send(`/bookings/${id}/cancel`, 'PATCH'),
  confirmBooking: (id) => send(`/bookings/${id}/confirm`, 'PATCH'),
  // support & safety
  updateRequest: (id, status) => send(`/support-requests/${id}`, 'PATCH', { status }),
  resolveTicket: (id) => send(`/support-ticket/${id}/resolve`, 'PATCH'),
  acknowledgeEmergency: (id) => send(`/emergency/${id}/acknowledge`, 'PATCH'),
  resolveEmergency: (id) => send(`/emergency/${id}/resolve`, 'PATCH'),
  // finance
  saveRevenueConfig: (body) => send('/admin/revenue-config', 'POST', body),
  processRefund: (bookingId, refundStatus, adminId) => send(`/refunds/booking/${bookingId}/process`, 'PATCH', { adminId, refundStatus }),
  generateReport: (adminId, reportDate) => send('/reports/generate', 'POST', { adminId, reportDate }),
  // settings
  saveSettings: (patch) => send('/platform/settings', 'PUT', patch),
  resetSettings: () => send('/platform/settings/reset', 'POST'),
};

export { formatINR } from '../../lib/pricing';

/** Download rows as a CSV file. */
export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
