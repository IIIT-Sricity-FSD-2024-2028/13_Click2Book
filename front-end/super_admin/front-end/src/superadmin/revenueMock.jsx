/**
 * Demo data for the Revenue page, used when the backend (port 3000) is not running.
 *
 * `revenueRequest()` has the same signature as `apiRequest()`: it calls the real
 * backend and, if the server cannot be reached, switches to an in-memory copy of the
 * revenue endpoints below for the rest of the session. Saving, refunds and resolving
 * tickets all work on that copy; a page reload starts again from the same demo data.
 */
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/http';
import { localISODate } from '../lib/dates';
import { DEFAULT_PLATFORM_SETTINGS } from '../lib/platformSettings';

const CUSTOMERS = [
  ['C001', 'Aakash Sharma'],
  ['C002', 'Priya Nair'],
  ['C003', 'Rahul Verma'],
  ['C004', 'Sneha Patel'],
  ['C005', 'Arjun Mehta'],
  ['C006', 'Deepika Rao'],
  ['C007', 'Vikram Singh'],
  ['C008', 'Meera Iyer'],
];
const PROVIDERS = [
  ['P001', 'APSRTC Travels'],
  ['P002', 'KPN Tours'],
  ['P003', 'Orange Travels'],
];
const METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'];

/**
 * One row per booking: [days ago, customer, provider, amount ₹, discount ₹, outcome].
 * Outcomes: ok · dispute · pending (payment pending) · failed (payment failed) ·
 * cancel:<REFUND STATUS> (cancelled, with a refund in that state).
 */
const BOOKINGS = [
  [0, 0, 0, 1240, 0, 'ok'],
  [0, 3, 1, 860, 50, 'ok'],
  [1, 1, 2, 1580, 0, 'ok'],
  [1, 5, 0, 720, 0, 'cancel:REQUESTED'],
  [2, 2, 1, 990, 0, 'ok'],
  [2, 6, 2, 1320, 100, 'ok'],
  [3, 4, 0, 640, 0, 'pending'],
  [3, 7, 1, 1150, 0, 'ok'],
  [4, 0, 2, 2100, 150, 'ok'],
  [5, 1, 0, 780, 0, 'cancel:PROCESSING'],
  [6, 3, 1, 1460, 0, 'dispute'],
  [7, 2, 2, 920, 0, 'ok'],
  [8, 5, 0, 1050, 0, 'failed'],
  [9, 6, 1, 1680, 0, 'ok'],
  [11, 7, 2, 870, 0, 'cancel:COMPLETED'],
  [12, 4, 0, 1390, 75, 'ok'],
  [13, 0, 1, 940, 0, 'ok'],
  [18, 1, 2, 1720, 0, 'ok'],
  [24, 2, 0, 660, 0, 'cancel:REJECTED'],
  [33, 3, 1, 1240, 0, 'ok'],
  [41, 6, 2, 1980, 120, 'ok'],
  [55, 5, 0, 830, 0, 'ok'],
  [68, 7, 1, 1510, 0, 'ok'],
  [84, 4, 2, 1120, 0, 'cancel:COMPLETED'],
  [97, 0, 0, 1860, 0, 'ok'],
  [122, 1, 1, 740, 0, 'ok'],
  [150, 2, 2, 1290, 0, 'ok'],
  [181, 3, 0, 1640, 100, 'ok'],
  [214, 5, 1, 980, 0, 'ok'],
  [246, 6, 2, 1430, 0, 'ok'],
  [275, 7, 0, 1170, 0, 'ok'],
  [305, 4, 1, 2050, 0, 'ok'],
  [334, 0, 2, 890, 0, 'ok'],
];
/** Extra support tickets on otherwise normal bookings: [booking index, category, status]. */
const EXTRA_TICKETS = [
  [0, 'complaint', 'open'],
  [4, 'lost_and_found', 'open'],
  [7, 'sos', 'resolved'],
  [16, 'complaint', 'resolved'],
];

const SOURCE = {
  cancellation: 'cancellation',
  complaint: 'support_request',
  sos: 'emergency',
  lost_and_found: 'lost_found',
  dispute: 'support_request',
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localISODate(d);
}

function buildStore() {
  const config = {
    id: 'RSC001',
    commissionPct: 10,
    convenienceFeeFlat: 2500,
    gatewayFeePct: 1.5,
    supportCostWeights: { cancellation: 800, complaint: 3500, sos: 0, lost_and_found: 1500, dispute: 3000 },
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
  const store = { config, payments: [], ledger: [], tickets: [], refunds: [], bookings: [], settings: null };
  store.settings = { ...JSON.parse(JSON.stringify(DEFAULT_PLATFORM_SETTINGS)), updatedAt: '1970-01-01T00:00:00.000Z', updatedBy: 'system' };
  let ticketNo = 1;
  const addTicket = (bookingId, category, status) => {
    const cost = config.supportCostWeights[category] || 0;
    store.tickets.push({
      ticketId: `TKT${String(ticketNo++).padStart(3, '0')}`,
      bookingId,
      category,
      sourceModule: SOURCE[category],
      costApplied: cost,
      status,
      createdAt: `${store.bookings.find((b) => b.bookingId === bookingId).bookingDate}T10:00:00.000Z`,
    });
    const row = store.ledger.find((l) => l.bookingId === bookingId);
    if (row) {
      row.supportCost += cost;
      row.adminNet -= cost;
    }
  };

  BOOKINGS.forEach(([ago, c, p, amount, discount, outcome], i) => {
    const bookingId = `B${101 + i}`;
    const date = daysAgo(ago);
    const cancelled = outcome.startsWith('cancel:');
    const [customerId] = CUSTOMERS[c];
    const [providerId, providerName] = PROVIDERS[p];
    store.bookings.push({
      bookingId,
      customerId,
      providerId,
      providerName,
      bookingDate: date,
      bookingStatus: cancelled ? 'CANCELLED' : outcome === 'pending' ? 'PENDING' : 'CONFIRMED',
    });
    const refundStatus = cancelled ? outcome.split(':')[1] : null;
    store.payments.push({
      paymentId: `PAY${101 + i}`,
      bookingId,
      amount,
      discountAmount: discount,
      paymentMethod: METHODS[i % METHODS.length],
      paymentStatus:
        outcome === 'pending' ? 'PENDING' : outcome === 'failed' ? 'FAILED' : refundStatus === 'COMPLETED' ? 'REFUNDED' : 'SUCCESS',
      paymentDate: date,
    });
    if (outcome === 'pending' || outcome === 'failed') return;

    // Fare split, in paise, as the backend locks it at booking time.
    const baseFare = (amount - config.convenienceFeeFlat / 100) * 100;
    const platformCommission = Math.round((baseFare * config.commissionPct) / 100);
    const gatewayFee = Math.round((baseFare * config.gatewayFeePct) / 100);
    store.ledger.push({
      bookingId,
      providerId,
      baseFare,
      platformCommission,
      operatorPayout: baseFare - platformCommission,
      gatewayFee,
      supportCost: 0,
      adminNet: platformCommission + config.convenienceFeeFlat - gatewayFee,
      status: cancelled ? 'cancelled' : outcome === 'dispute' ? 'disputed' : 'clean',
    });

    if (cancelled) {
      const s = store.settings.cancellation;
      store.refunds.push({
        bookingId,
        adminId: refundStatus === 'REQUESTED' ? null : 'A001',
        refundAmount: Math.max(0, Math.round(((amount - config.convenienceFeeFlat / 100) * s.refundPercent) / 100 - s.cancellationFee)),
        refundStatus,
        refundDate: daysAgo(Math.max(0, ago - 1)),
      });
      addTicket(bookingId, 'cancellation', refundStatus === 'REQUESTED' ? 'open' : 'resolved');
    }
    if (outcome === 'dispute') addTicket(bookingId, 'dispute', 'open');
  });
  EXTRA_TICKETS.forEach(([i, category, status]) => addTicket(`B${101 + i}`, category, status));
  return store;
}

let store = null;
const db = () => (store ||= buildStore());

const ok = (data, message = 'OK') => ({ success: true, message, data });
const fail = (message) => {
  throw new Error(message);
};
const copy = (v) => JSON.parse(JSON.stringify(v));

/** The revenue endpoints, answered from the demo store. Returns the backend's `{ success, data }` envelope. */
function handle(method, path, body) {
  const s = db();
  const [route, query = ''] = path.split('?');
  const status = new URLSearchParams(query).get('status');
  const is = (m, re) => method === m && re.exec(route);
  let m;

  if (is('GET', /^\/admin\/revenue-config$/)) return ok(s.config);
  if (is('POST', /^\/admin\/revenue-config$/)) {
    Object.assign(s.config, body, {
      supportCostWeights: { ...s.config.supportCostWeights, ...body.supportCostWeights },
      updatedAt: new Date().toISOString(),
    });
    return ok(s.config, 'Revenue split config saved (demo data)');
  }
  if (is('GET', /^\/admin\/ledger\/summary$/)) {
    const sum = (k) => s.ledger.reduce((t, r) => t + r[k], 0);
    return ok({
      count: s.ledger.length,
      baseFare: sum('baseFare'),
      operatorPayout: sum('operatorPayout'),
      platformCommission: sum('platformCommission'),
      gatewayFee: sum('gatewayFee'),
      supportCost: sum('supportCost'),
      adminNet: sum('adminNet'),
    });
  }
  if (is('GET', /^\/admin\/ledger$/)) return ok(s.ledger.filter((r) => !status || r.status === status));
  if (is('GET', /^\/admin\/payouts\/summary$/)) {
    const by = {};
    s.ledger
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const [, label] = PROVIDERS.find(([id]) => id === r.providerId);
        by[r.providerId] = by[r.providerId] || { id: r.providerId, label, total: 0, count: 0 };
        by[r.providerId].total += r.operatorPayout;
        by[r.providerId].count += 1;
      });
    return ok(Object.values(by).sort((a, b) => b.total - a.total));
  }
  if (is('GET', /^\/payments$/)) return ok(s.payments);
  if (is('GET', /^\/support-ticket$/)) return ok(s.tickets.filter((t) => !status || t.status === status));
  if ((m = is('PATCH', /^\/support-ticket\/([^/]+)\/resolve$/))) {
    const t = s.tickets.find((x) => x.ticketId === m[1]) || fail(`Ticket ${m[1]} not found`);
    t.status = 'resolved';
    return ok(t, 'Ticket resolved');
  }
  if (is('GET', /^\/refunds$/)) return ok(s.refunds.filter((r) => !status || r.refundStatus === status));
  if ((m = is('PATCH', /^\/refunds\/booking\/([^/]+)\/process$/))) {
    const r = s.refunds.find((x) => x.bookingId === m[1]) || fail(`No refund for booking ${m[1]}`);
    if (r.refundStatus === 'COMPLETED') fail('Refund already completed');
    Object.assign(r, { adminId: body.adminId, refundStatus: body.refundStatus });
    if (body.refundStatus === 'COMPLETED') s.payments.find((p) => p.bookingId === m[1]).paymentStatus = 'REFUNDED';
    return ok(r, `Refund ${body.refundStatus}`);
  }
  if (is('GET', /^\/bookings$/)) return ok(s.bookings);
  if (is('GET', /^\/customers$/)) return ok(CUSTOMERS.map(([customerId, name]) => ({ customerId, name })));
  if (is('GET', /^\/platform\/settings$/)) return ok(s.settings);
  if (is('PUT', /^\/platform\/settings$/)) {
    for (const [section, values] of Object.entries(body)) Object.assign(s.settings[section], values);
    Object.assign(s.settings, { updatedAt: new Date().toISOString(), updatedBy: 'Super Admin (demo)' });
    return ok(s.settings, 'Settings saved');
  }
  return fail(`Demo data has no ${method} ${route}`);
}

/* ── Demo mode switch ── */
let demo = false;
const listeners = new Set();

/** True once the backend could not be reached; the page then shows demo data. */
export function useRevenueDemo() {
  const [on, setOn] = useState(demo);
  useEffect(() => {
    listeners.add(setOn);
    setOn(demo);
    return () => listeners.delete(setOn);
  }, []);
  return on;
}

/** `apiRequest()` for the Revenue page, falling back to demo data when the backend is offline. */
export async function revenueRequest(path, opts = {}) {
  if (!demo) {
    try {
      return await apiRequest(path, opts);
    } catch (err) {
      // fetch() rejects with a TypeError only when the server cannot be reached;
      // API errors (validation, not found…) are real answers and are passed on.
      if (!(err instanceof TypeError)) throw err;
      demo = true;
      listeners.forEach((fn) => fn(true));
    }
  }
  const json = copy(handle(String(opts.method || 'GET').toUpperCase(), path, opts.body || {}));
  return opts.raw ? json : json.data;
}
