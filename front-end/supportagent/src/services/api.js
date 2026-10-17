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
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const json = await res.json();
      apiData = json.data || [];
      isLive = true;
    }
  } catch (e) {
    isLive = false;
  }

  // 1. Local storage tickets from Support Portal
  let localTickets = getLocal(STORAGE_KEYS.TICKETS, null);
  if (!localTickets) {
    localTickets = INITIAL_TICKETS;
    setLocal(STORAGE_KEYS.TICKETS, localTickets);
  }

  // 2. Read from customer portal requests (c2b_support_requests)
  let customerRequests = [];
  try {
    customerRequests = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
  } catch (_) {}

  // 3. Read from legacy window.DB if present
  let dbTickets = [];
  try {
    if (typeof window !== 'undefined' && window.DB && window.DB.supportRequests) {
      const rawDb = window.DB.supportRequests.getAll() || [];
      dbTickets = rawDb.map((r) => ({
        id: r.request_id || r.requestId || r.id,
        customer: r.customerName || r.customer_name || r.customer_id || 'Customer',
        customerId: r.customer_id || r.customerId || 'C001',
        subject: r.description || r.issue || r.subject || 'Support request',
        description: r.description || r.issue || r.subject || '',
        priority: r.priority || 'Medium',
        status: r.status === 'OPEN' ? 'Open' : (r.status === 'RESOLVED' ? 'Resolved' : (r.status === 'IN_PROGRESS' ? 'In Progress' : 'Open')),
        bookingId: r.booking_id || r.bookingId || '',
        category: r.category || 'Booking Issue',
        sourceModule: 'support-request',
        createdAt: r.created_date || r.createdAt || new Date().toISOString(),
        resolution: r.resolution || r.response || '',
      })).filter((t) => Boolean(t.id));
    }
  } catch (e) {}

  // Merge and deduplicate by canonical ticket ID
  const map = new Map();

  // A. Local tickets
  localTickets.forEach((t) => {
    if (t.id) map.set(t.id, t);
  });

  // B. Customer portal submissions
  customerRequests.forEach((cr) => {
    const id = cr.requestId || cr.request_id || cr.id;
    if (id) {
      const existing = map.get(id) || {};
      map.set(id, {
        id,
        customer: cr.customerName || cr.customer_name || existing.customer || cr.customerId || 'Customer',
        customerId: cr.customerId || cr.customer_id || existing.customerId || 'C001',
        subject: cr.description || cr.subject || existing.subject || 'Support request',
        description: cr.description || existing.description || '',
        priority: cr.priority || existing.priority || 'Medium',
        status: cr.status === 'RESOLVED' ? 'Resolved' : (cr.status === 'IN_PROGRESS' ? 'In Progress' : (existing.status || 'Open')),
        category: cr.category || existing.category || 'Booking Issue',
        sourceModule: 'support-request',
        bookingId: cr.bookingId || cr.booking_id || existing.bookingId || '',
        createdAt: cr.createdAt || cr.createdDate || existing.createdAt || new Date().toISOString(),
        resolution: cr.resolution || cr.response || existing.resolution || '',
        resolvedAt: cr.resolvedAt || existing.resolvedAt || '',
        resolvedBy: cr.resolvedBy || existing.resolvedBy || '',
      });
    }
  });

  // C. Legacy DB
  dbTickets.forEach((t) => {
    if (t.id) {
      map.set(t.id, { ...map.get(t.id), ...t });
    }
  });

  // D. Backend Authoritative API Tickets
  apiData.forEach((a) => {
    const id = a.requestId || a.request_id || a.id;
    if (id) {
      const existing = map.get(id) || {};
      const normStatus = a.status === 'RESOLVED' ? 'Resolved' : (a.status === 'IN_PROGRESS' ? 'In Progress' : (a.status === 'ESCALATED' ? 'Escalated' : (a.status === 'OPEN' ? 'Open' : (existing.status || 'Open'))));
      // Never revert a known resolved ticket to open if locally resolved
      const finalStatus = (existing.status === 'Resolved' && normStatus === 'Open') ? 'Resolved' : normStatus;

      map.set(id, {
        id,
        customer: a.customerName || a._customerName || existing.customer || a.customerId || 'Customer',
        customerId: a.customerId || existing.customerId || 'C001',
        subject: a.description || a.subject || a.issue || existing.subject || 'Support request',
        description: a.description || existing.description || '',
        priority: a.priority || existing.priority || 'Medium',
        status: finalStatus,
        category: a.category || a._category || existing.category || 'Booking Issue',
        sourceModule: a.sourceModule || 'support-request',
        bookingId: a.bookingId || a._bookingId || existing.bookingId || '',
        createdAt: a.createdDate || a.createdAt || existing.createdAt || new Date().toISOString(),
        resolution: a.resolution || existing.resolution || a.resolutionNote || '',
        resolvedAt: a.resolvedAt || existing.resolvedAt || '',
        resolvedBy: a.resolvedBy || existing.resolvedBy || '',
      });
    }
  });

  const merged = Array.from(map.values());
  setLocal(STORAGE_KEYS.TICKETS, merged);
  return { tickets: merged, isLive };
}

export async function resolveTicket(ticketId, note = 'Issue investigated and resolved.') {
  const resolutionNote = note || 'Resolved by Support Agent';
  let apiSuccess = false;

  // 1. Authoritative PATCH /support-requests/:id
  try {
    const res = await fetch(`${API_BASE}/support-requests/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      body: JSON.stringify({
        status: 'RESOLVED',
        supporterId: 'SUP001',
        resolution: resolutionNote,
        resolvedBy: 'Support Agent',
        resolvedAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      apiSuccess = true;
    } else {
      // Fallback check for support-ticket ledger endpoint
      const altRes = await fetch(`${API_BASE}/support-ticket/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      });
      if (altRes.ok) apiSuccess = true;
    }
  } catch (e) {
    // API offline
  }

  // 2. Update local storage in Support Portal
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  let foundLocal = false;
  const updated = localTickets.map((t) => {
    if (t.id === ticketId) {
      foundLocal = true;
      return {
        ...t,
        status: 'Resolved',
        resolution: resolutionNote,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Support Agent',
      };
    }
    return t;
  });
  if (!foundLocal) {
    updated.unshift({
      id: ticketId,
      customer: 'Customer',
      subject: 'Support query',
      priority: 'Medium',
      status: 'Resolved',
      resolution: resolutionNote,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Support Agent',
      createdAt: new Date().toISOString(),
    });
  }
  setLocal(STORAGE_KEYS.TICKETS, updated);

  // 3. Update customer portal shared storage (c2b_support_requests)
  try {
    const custReqs = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
    if (Array.isArray(custReqs)) {
      let custFound = false;
      const updatedCust = custReqs.map((r) => {
        const id = r.requestId || r.request_id || r.id;
        if (id === ticketId) {
          custFound = true;
          return {
            ...r,
            status: 'RESOLVED',
            resolution: resolutionNote,
            response: resolutionNote,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Support Agent',
          };
        }
        return r;
      });
      if (custFound) {
        localStorage.setItem('c2b_support_requests', JSON.stringify(updatedCust));
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch (e) {}

  // 4. Update legacy DB if available
  try {
    if (typeof window !== 'undefined' && window.DB && window.DB.supportRequests) {
      window.DB.supportRequests.update(ticketId, {
        status: 'RESOLVED',
        resolution: resolutionNote,
      });
    }
  } catch (e) {}

  return { success: true, apiSuccess };
}

export async function deescalateTicket(ticketId, note = 'De-escalated and resolved by support supervisor.') {
  await resolveTicket(ticketId, note);

  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);

  // Add to resolved escalations history
  if (target) {
    const resolvedList = getLocal(STORAGE_KEYS.ESCALATIONS_RESOLVED, INITIAL_ESCALATIONS_RESOLVED);
    const updatedResolved = [
      {
        id: target.id,
        customer: target.customer,
        bookingId: target.bookingId || 'B001',
        subject: target.subject,
        priority: target.priority,
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
export async function getRefunds() {
  let apiRefunds = [];

  // 1. Fetch from backend API
  try {
    const res = await fetch(`${API_BASE}/refunds`, {
      headers: { 'x-role': 'SUPPORT' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const json = await res.json();
      apiRefunds = json.data || [];
    }
  } catch (e) {}

  // 2. Read from customer portal local refunds (c2b_refunds)
  let customerLocalRefunds = [];
  try {
    customerLocalRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
  } catch (_) {}

  // 3. Read cancelled bookings from c2b_bookings
  let cancelledBookings = [];
  try {
    const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
    cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED' || b.booking_status === 'CANCELLED');
  } catch (_) {}

  // 4. Read support portal local refunds
  let supportLocalRefunds = getLocal(STORAGE_KEYS.REFUNDS, null);
  if (!supportLocalRefunds) {
    supportLocalRefunds = INITIAL_REFUNDS;
    setLocal(STORAGE_KEYS.REFUNDS, supportLocalRefunds);
  }

  // Unify and deduplicate by canonical bookingId / refundId
  const map = new Map();

  // A. Initial / support local
  supportLocalRefunds.forEach((r) => {
    const key = r.bookingId || r.booking_id || r.refundId;
    if (key) {
      map.set(key, {
        refundId: r.refundId || `REF-${key}`,
        bookingId: key,
        customer: r.customer || r.passengerName || 'Customer',
        amount: Number(r.amount || r.refundAmount || 0),
        status: (r.status || 'REQUESTED').toUpperCase(),
        date: r.date || r.refundDate || new Date().toISOString().split('T')[0],
        reason: r.reason || 'Ticket cancellation',
      });
    }
  });

  // B. Cancelled bookings
  cancelledBookings.forEach((b) => {
    const bId = b.bookingId || b.booking_id;
    if (bId) {
      const existing = map.get(bId) || {};
      const fare = Number(b.total || b.fare || 650);
      const amt = Math.max(0, fare - 50);
      map.set(bId, {
        refundId: existing.refundId || `REF-${bId}`,
        bookingId: bId,
        customer: existing.customer || b.passengerName || b.customerName || 'Customer',
        amount: existing.amount || amt,
        status: existing.status || 'REQUESTED',
        date: existing.date || (b.cancelled_at ? b.cancelled_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        reason: existing.reason || `Cancelled: ${b.from || 'Source'} → ${b.to || 'Destination'}`,
      });
    }
  });

  // C. Customer portal c2b_refunds
  if (Array.isArray(customerLocalRefunds)) {
    customerLocalRefunds.forEach((r) => {
      const key = r.bookingId || r.booking_id || (r.refund_id ? r.refund_id.replace(/^REF-/, '') : null);
      if (key) {
        const existing = map.get(key) || {};
        map.set(key, {
          refundId: r.refund_id || r.refundId || `REF-${key}`,
          bookingId: key,
          customer: r.customer_name || r.customer || existing.customer || 'Customer',
          amount: Number(r.refund_amount !== undefined ? r.refund_amount : (r.amount !== undefined ? r.amount : existing.amount || 0)),
          status: (r.status || existing.status || 'REQUESTED').toUpperCase(),
          date: r.request_date || r.date || existing.date || new Date().toISOString().split('T')[0],
          reason: r.reason || existing.reason || (r.route ? `Cancellation: ${r.route}` : 'Customer requested cancellation'),
        });
      }
    });
  }

  // D. Backend authoritative API refunds
  if (Array.isArray(apiRefunds)) {
    apiRefunds.forEach((a) => {
      const key = a.bookingId || (a.refundId ? a.refundId.replace(/^REF-/, '') : null);
      if (key) {
        const existing = map.get(key) || {};
        map.set(key, {
          refundId: a.refundId || `REF-${key}`,
          bookingId: key,
          customer: a.passengerName || existing.customer || a.customerId || 'Customer',
          amount: Number(a.refundAmount !== undefined ? a.refundAmount : existing.amount || 0),
          status: (a.refundStatus || existing.status || 'REQUESTED').toUpperCase(),
          date: a.refundDate || existing.date || new Date().toISOString().split('T')[0],
          reason: a.reason || existing.reason || 'Ticket cancelled by customer',
        });
      }
    });
  }

  const unified = Array.from(map.values());
  setLocal(STORAGE_KEYS.REFUNDS, unified);
  return unified;
}

export async function updateRefundStatus(refundId, newStatus) {
  // 1. Resolve canonical booking ID
  let targetBookingId = refundId;
  if (String(targetBookingId).startsWith('REF-')) {
    targetBookingId = targetBookingId.replace(/^REF-/, '');
  }

  // 2. Authoritative backend PATCH call
  let apiSuccess = false;
  try {
    const res = await fetch(`${API_BASE}/refunds/booking/${targetBookingId}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'SUPPORT',
      },
      body: JSON.stringify({
        adminId: 'SUP001',
        refundStatus: newStatus,
      }),
    });
    if (res.ok) {
      apiSuccess = true;
    }
  } catch (e) {
    console.warn('[Refunds API] process note:', e.message);
  }

  // 3. Update STORAGE_KEYS.REFUNDS
  const current = getLocal(STORAGE_KEYS.REFUNDS, []);
  const today = new Date().toISOString().split('T')[0];
  const updated = current.map((r) => {
    if (r.refundId === refundId || r.bookingId === targetBookingId) {
      return { ...r, status: newStatus, date: today };
    }
    return r;
  });
  setLocal(STORAGE_KEYS.REFUNDS, updated);

  // 4. Synchronize with c2b_refunds (Customer Portal)
  try {
    const custRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
    if (Array.isArray(custRefunds)) {
      let found = false;
      const updatedCust = custRefunds.map((cr) => {
        const cKey = cr.booking_id || cr.bookingId || (cr.refund_id ? cr.refund_id.replace(/^REF-/, '') : '');
        if (cKey === targetBookingId || cr.refund_id === refundId || cr.refundId === refundId) {
          found = true;
          return {
            ...cr,
            status: newStatus,
            refund_status: newStatus,
            processed_date: today,
          };
        }
        return cr;
      });
      if (found) {
        localStorage.setItem('c2b_refunds', JSON.stringify(updatedCust));
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch (_) {}

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
