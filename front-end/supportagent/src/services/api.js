/**
 * Click2Book — Support Agent API Service Layer
 * Resilient connector between NestJS REST API and localStorage fallback
 */
import {
  INITIAL_TICKETS,
  INITIAL_CUSTOMERS,
  INITIAL_REFUNDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ESCALATIONS_RESOLVED,
} from './mockData';

const HOSTNAME = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'localhost'
  : (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

export const API_BASE = `http://${HOSTNAME}:3000/api`;

export function getStaffPortalUrl() {
  if (typeof window === 'undefined') return '/staff-access.html';
  const port = window.location.port;
  const hostname = window.location.hostname || 'localhost';
  const protocol = window.location.protocol || 'http:';

  // Multi-portal environment (3001-3005) or Vite dev server
  if (['3001', '3002', '3003', '3004', '3005', '5173', '5174', '5175'].includes(port)) {
    return `${protocol}//${hostname}:3001/staff-access.html`;
  }

  // Fallback for file:// protocol
  if (protocol === 'file:') {
    return '../landing-page/staff-access.html';
  }

  return '/staff-access.html';
}

export function navigateToStaffPortal(e) {
  if (e) {
    try {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    } catch (_) {}
  }
  const target = getStaffPortalUrl();
  try {
    window.location.assign(target);
  } catch (_) {
    window.location.href = target;
  }
}

export const formatRupees = (val) => {
  if (val === undefined || val === null) return '₹0';
  // If val > 100000 assume paise else rupees
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
};

export const formatPaiseToRupees = (paise) => {
  if (!paise) return '₹0';
  const rupees = paise / 100;
  return rupees.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
};

/* ── LocalStorage Helpers ── */
const STORAGE_KEYS = {
  TICKETS: 'c2b_support_tickets_v2',
  COST_TICKETS: 'c2b_support_cost_tickets_v2',
  REFUNDS: 'c2b_support_refunds_v2',
  CUSTOMERS: 'c2b_support_customers_v2',
  NOTIFICATIONS: 'c2b_support_notifications_v2',
  ESCALATIONS_RESOLVED: 'c2b_support_esc_resolved_v2',
};

function getLocal(key, defaultVal) {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.warn(`[API] Failed to parse ${key}`, e);
    return defaultVal;
  }
}

function setLocal(key, val) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`[API] Failed to save ${key}`, e);
  }
}

/* ── Support Tickets API ── */
export async function getTickets() {
  let apiData = [];
  let isLive = false;

  try {
    const res = await fetch(`${API_BASE}/support-requests`, {
      headers: { 'x-role': 'SUPPORT' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      apiData = json.data || [];
      isLive = true;
    }
  } catch (e) {
    // API offline or error; fallback smoothly
    isLive = false;
  }

  // Local storage tickets
  let localTickets = getLocal(STORAGE_KEYS.TICKETS, null);
  if (!localTickets) {
    localTickets = INITIAL_TICKETS;
    setLocal(STORAGE_KEYS.TICKETS, localTickets);
  }

  // Also read from legacy window.DB if present
  let dbTickets = [];
  try {
    if (typeof window !== 'undefined' && window.DB && window.DB.supportRequests) {
      const rawDb = window.DB.supportRequests.getAll() || [];
      dbTickets = rawDb.map((r) => ({
        id: r.request_id || `REQ${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        customer: r.customer_id || 'Customer',
        subject: r.description || r.issue || r.subject || 'Support request',
        priority: r.priority || 'Medium',
        status: r.status === 'OPEN' ? 'Open' : (r.status === 'RESOLVED' ? 'Resolved' : (r.status === 'IN_PROGRESS' ? 'In Progress' : 'Open')),
        bookingId: r.booking_id || '',
        category: 'SUPPORT',
        sourceModule: 'support-request',
        createdAt: r.created_date || new Date().toISOString(),
      }));
    }
  } catch (e) {
    // legacy DB ignore
  }

  // Merge and deduplicate by ID
  const map = new Map();
  // 1. mock / local
  localTickets.forEach((t) => map.set(t.id, t));
  // 2. legacy DB
  dbTickets.forEach((t) => map.set(t.id, { ...map.get(t.id), ...t }));
  // 3. API tickets
  apiData.forEach((a) => {
    const id = a.request_id || a.requestId || a.id;
    if (id) {
      map.set(id, {
        id,
        customer: a._customerName || a.customerName || a.customerId || 'Customer',
        subject: a.subject || a.issue || a.description || 'Support request',
        priority: (a.priority || 'Medium').charAt(0).toUpperCase() + (a.priority || 'Medium').slice(1).toLowerCase(),
        status: a.status === 'OPEN' ? 'Open' : (a.status === 'RESOLVED' ? 'Resolved' : (a.status || 'Open')),
        category: a._category || a.category || 'SUPPORT',
        sourceModule: a.sourceModule || 'support-request',
        bookingId: a._bookingId || a.bookingId || '',
        createdAt: a.createdAt || a.created_date || new Date().toISOString(),
      });
    }
  });

  const merged = Array.from(map.values());
  return { tickets: merged, isLive };
}

export async function resolveTicket(ticketId) {
  // Try API first
  let apiSuccess = false;
  try {
    const res = await fetch(`${API_BASE}/support-requests/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    if (res.ok) apiSuccess = true;
  } catch (e) {
    // API offline
  }

  // Update local storage
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const updated = localTickets.map((t) =>
    t.id === ticketId
      ? { ...t, status: 'Resolved', resolvedAt: new Date().toISOString(), resolvedBy: 'Support Agent' }
      : t
  );
  setLocal(STORAGE_KEYS.TICKETS, updated);

  // Update legacy DB if available
  try {
    if (typeof window !== 'undefined' && window.DB && window.DB.supportRequests) {
      window.DB.supportRequests.update(ticketId, { status: 'RESOLVED' });
    }
  } catch (e) {
    // ignore
  }

  return { success: true, apiSuccess };
}

export async function deescalateTicket(ticketId, note = 'De-escalated and resolved by support supervisor.') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  let resolvedTicket = null;
  const updated = localTickets.map((t) => {
    if (t.id === ticketId) {
      resolvedTicket = {
        ...t,
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Support Agent',
        resolutionNote: note,
      };
      return resolvedTicket;
    }
    return t;
  });
  setLocal(STORAGE_KEYS.TICKETS, updated);

  // Add to resolved escalations history
  if (resolvedTicket) {
    const resolvedList = getLocal(STORAGE_KEYS.ESCALATIONS_RESOLVED, INITIAL_ESCALATIONS_RESOLVED);
    const updatedResolved = [
      {
        id: resolvedTicket.id,
        customer: resolvedTicket.customer,
        bookingId: resolvedTicket.bookingId || 'B001',
        subject: resolvedTicket.subject,
        priority: resolvedTicket.priority,
        status: 'Resolved',
        resolvedBy: 'Support Agent',
        resolutionNote: note,
        resolvedDate: new Date().toISOString().split('T')[0],
      },
      ...resolvedList,
    ];
    setLocal(STORAGE_KEYS.ESCALATIONS_RESOLVED, updatedResolved);
  }

  return { success: true };
}

/* ── Financial Cost Ledger API (/api/support-ticket) ── */
export async function getCostTickets(filters = {}) {
  let isLive = false;
  let data = [];

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  const qs = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await fetch(`${API_BASE}/support-ticket${qs}`, {
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      data = json.data || [];
      isLive = true;
    }
  } catch (e) {
    isLive = false;
  }

  if (!isLive) {
    // Generate/read local cost tickets
    let local = getLocal(STORAGE_KEYS.COST_TICKETS, null);
    if (!local) {
      local = [
        { ticketId: 'ST-101', bookingId: 'B004', category: 'complaint', sourceModule: 'manual', costApplied: 350000, createdAt: '2026-10-13T09:30:00.000Z', status: 'open' },
        { ticketId: 'ST-102', bookingId: 'B012', category: 'cancellation', sourceModule: 'support-request', costApplied: 80000, createdAt: '2026-10-12T14:15:00.000Z', status: 'resolved' },
        { ticketId: 'ST-103', bookingId: 'B025', category: 'complaint', sourceModule: 'support-request', costApplied: 350000, createdAt: '2026-10-13T07:45:00.000Z', status: 'open' },
        { ticketId: 'ST-104', bookingId: 'B060', category: 'sos', sourceModule: 'emergency', costApplied: 0, createdAt: '2026-10-13T10:15:00.000Z', status: 'open' },
        { ticketId: 'ST-105', bookingId: 'B052', category: 'dispute', sourceModule: 'manual', costApplied: 500000, createdAt: '2026-10-12T18:30:00.000Z', status: 'resolved' },
      ];
      setLocal(STORAGE_KEYS.COST_TICKETS, local);
    }
    data = local.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.category && t.category !== filters.category) return false;
      return true;
    });
  }

  return { data, isLive };
}

export async function createManualCostTicket(payload) {
  let isLive = false;
  let newTicket = null;

  try {
    const res = await fetch(`${API_BASE}/support-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      newTicket = json.data;
      isLive = true;
    }
  } catch (e) {
    isLive = false;
  }

  // Cost weights fallback
  const costMap = {
    complaint: 350000,
    dispute: 500000,
    cancellation: 80000,
    lost_and_found: 100000,
    sos: 0,
  };

  const localCost = getLocal(STORAGE_KEYS.COST_TICKETS, []);
  const created = newTicket || {
    ticketId: `ST-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: payload.bookingId,
    category: payload.category,
    sourceModule: payload.sourceModule || 'manual',
    costApplied: costMap[payload.category] || 350000,
    createdAt: new Date().toISOString(),
    status: 'open',
  };

  setLocal(STORAGE_KEYS.COST_TICKETS, [created, ...localCost]);
  return { success: true, ticket: created, isLive };
}

export async function resolveCostTicket(ticketId) {
  let isLive = false;
  try {
    const res = await fetch(`${API_BASE}/support-ticket/${ticketId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
    });
    if (res.ok) isLive = true;
  } catch (e) {
    isLive = false;
  }

  const local = getLocal(STORAGE_KEYS.COST_TICKETS, []);
  const updated = local.map((t) => (t.ticketId === ticketId ? { ...t, status: 'resolved' } : t));
  setLocal(STORAGE_KEYS.COST_TICKETS, updated);

  return { success: true, isLive };
}

/* ── Customer Lookup ── */
export function getCustomers() {
  let customers = getLocal(STORAGE_KEYS.CUSTOMERS, null);
  if (!customers) {
    customers = INITIAL_CUSTOMERS;
    setLocal(STORAGE_KEYS.CUSTOMERS, customers);
  }
  return customers;
}

/* ── Refunds Management ── */
export function getRefunds() {
  let refunds = getLocal(STORAGE_KEYS.REFUNDS, null);
  if (!refunds) {
    refunds = INITIAL_REFUNDS;
    setLocal(STORAGE_KEYS.REFUNDS, refunds);
  }
  return refunds;
}

export function updateRefundStatus(refundId, newStatus) {
  const refunds = getRefunds();
  const updated = refunds.map((r) =>
    r.refundId === refundId
      ? { ...r, status: newStatus, date: new Date().toISOString().split('T')[0] }
      : r
  );
  setLocal(STORAGE_KEYS.REFUNDS, updated);
  return updated;
}

/* ── Notifications ── */
export function getNotifications() {
  let notifs = getLocal(STORAGE_KEYS.NOTIFICATIONS, null);
  if (!notifs) {
    notifs = INITIAL_NOTIFICATIONS;
    setLocal(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
  return notifs;
}

export function markNotificationsAsRead() {
  const notifs = getNotifications();
  const updated = notifs.map((n) => ({ ...n, read: true }));
  setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
  return updated;
}
