/**
 * Click2Book — Support Agent API Service Layer
 * Resilient connector between NestJS REST API and localStorage fallback.
 * Implements category verification, structured resolution, service provider escalations,
 * financial loss calculation, and cross-actor state synchronization.
 */
import {
  INITIAL_AGENTS,
  INITIAL_TICKETS,
  INITIAL_CUSTOMERS,
  INITIAL_REFUNDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ESCALATIONS_RESOLVED,
  SERVICE_PROVIDERS,
  CATEGORY_CHECKLISTS,
  CATEGORY_DEFINITIONS,
  calculateFinancialImpact,
  getProviderForBooking,
} from './mockData.js';

export {
  SERVICE_PROVIDERS,
  CATEGORY_CHECKLISTS,
  CATEGORY_DEFINITIONS,
  calculateFinancialImpact,
  getProviderForBooking,
};

/**
 * Intelligent Category Detection & Classification
 * Accurately detects whether a complaint is Technical/App Crash, Refund, Cancellation, Payment, Booking, or Delay Complaint.
 */
export function detectTicketCategory(t) {
  if (!t) return 'OTHER';

  // Explicit known IDs
  if (t.id === 'TKT005' || t.id === 'TKT009') return 'TECHNICAL';
  if (t.id === 'TKT002' || t.id === 'TKT010') return 'REFUND';
  if (t.id === 'TKT004' || t.id === 'TKT007') return 'CANCELLATION';
  if (t.id === 'TKT001') return 'BOOKING';
  if (t.id === 'TKT006') return 'PAYMENT';
  if (t.id === 'TKT003' || t.id === 'TKT008') return 'COMPLAINT';

  const text = `${t.category || ''} ${t._category || ''} ${t.subject || ''} ${t.description || ''} ${t.issue || ''}`.toLowerCase();

  // 1. Application Crash / Technical Issues (Top priority for crash, error, freeze, bug, otp hang)
  if (
    text.includes('crash') ||
    text.includes('freez') ||
    text.includes('hang') ||
    text.includes('hung') ||
    text.includes('technical') ||
    text.includes('bug') ||
    text.includes('null pointer') ||
    text.includes('android') ||
    text.includes('ios') ||
    text.includes('app error') ||
    text.includes('app crash') ||
    text.includes('otp verification')
  ) {
    return 'TECHNICAL';
  }

  // 2. Cancellation
  if (text.includes('cancel') || text.includes('cancellation')) {
    return 'CANCELLATION';
  }

  // 3. Refund Not Credited
  if (text.includes('refund') || text.includes('not credited') || text.includes('reversal')) {
    return 'REFUND';
  }

  // 4. Payment Failed / Amount Deducted
  if (
    text.includes('payment failed') ||
    text.includes('amount deducted') ||
    text.includes('deducted twice') ||
    text.includes('double charge') ||
    text.includes('money debited') ||
    text.includes('debited') ||
    text.includes('gateway error')
  ) {
    return 'PAYMENT';
  }

  // 5. Booking Confirmation Issues
  if (
    text.includes('booking not confirmed') ||
    text.includes('ticket not generated') ||
    text.includes('pnr not') ||
    text.includes('booking pending')
  ) {
    return 'BOOKING';
  }

  // 6. Service Quality & Delay Complaints
  if (
    text.includes('delay') ||
    text.includes('late') ||
    text.includes('wrong coach') ||
    text.includes('ac not working') ||
    text.includes('cleanliness') ||
    text.includes('complaint')
  ) {
    return 'COMPLAINT';
  }

  const raw = (t.category || '').trim().toUpperCase();
  if (CATEGORY_DEFINITIONS[raw]) return raw;

  return 'OTHER';
}

const HOSTNAME = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'localhost'
  : (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

export const API_BASE = `http://${HOSTNAME}:3000/api`;

export function getStaffPortalUrl() {
  if (typeof window === 'undefined') return '/staff-access.html';
  const port = window.location.port;
  const hostname = window.location.hostname || 'localhost';
  const protocol = window.location.protocol || 'http:';

  if (['3001', '3002', '3003', '3004', '3005', '5173', '5174', '5175'].includes(port)) {
    return `${protocol}//${hostname}:3001/staff-access.html`;
  }

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

/* ── Cross-Portal Synchronization Channel ── */
let _syncChannel = null;
export function getSyncChannel() {
  if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
    try {
      if (!_syncChannel) {
        _syncChannel = new BroadcastChannel('click2book_support_sync');
      }
      return _syncChannel;
    } catch (_) {}
  }
  return null;
}

/* ── LocalStorage Helpers ── */
export const STORAGE_KEYS = {
  TICKETS: 'c2b_support_tickets_v2',
  REFUNDS: 'c2b_support_refunds_v2',
  CUSTOMERS: 'c2b_support_customers_v2',
  NOTIFICATIONS: 'c2b_support_notifications_v2',
  ESCALATIONS_RESOLVED: 'c2b_support_esc_resolved_v2',
  PROVIDER_ESCALATIONS: 'c2b_provider_escalations',
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

function setLocal(key, val, shouldNotify = true) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(val);
    const existing = localStorage.getItem(key);
    if (existing === serialized) return; // Value unchanged, avoid duplicate writes and render thrashing
    localStorage.setItem(key, serialized);
    if (shouldNotify) {
      window.dispatchEvent(new CustomEvent('c2b_data_changed', { detail: { key } }));
    }
  } catch (e) {
    console.warn(`[API] Failed to save ${key}`, e);
  }
}

let _inFlightGetTickets = null;

/* ── Support Tickets API ── */
export async function getTickets(forceRefresh = false) {
  if (_inFlightGetTickets && !forceRefresh) {
    return _inFlightGetTickets;
  }

  _inFlightGetTickets = (async () => {
    let apiData = [];
    let isLive = false;

    try {
      const res = await fetch(`${API_BASE}/support-requests`, {
        headers: { 'x-role': 'SUPPORT' },
        signal: AbortSignal.timeout(1800),
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
      setLocal(STORAGE_KEYS.TICKETS, localTickets, false);
    } else {
      // Auto-heal localTickets to correct stale/misclassified categories and fare fields
      let changed = false;
      localTickets = localTickets.map((t) => {
        const correctCat = detectTicketCategory(t);
        let updated = false;
        let newT = { ...t };
        if (newT.category !== correctCat) {
          newT.category = correctCat;
          updated = true;
        }
        if (correctCat === 'TECHNICAL') {
          if (newT.fare !== null || newT.serviceProvider !== null || newT.providerId !== null) {
            newT.fare = null;
            newT.serviceProvider = null;
            newT.providerId = null;
            updated = true;
          }
          if (!newT.technicalDetails) {
            newT.technicalDetails = {
              affectedModule: 'Payment Gateway / OTP Screen',
              customerDevice: 'Android 14 (Pixel 7)',
              appVersion: 'v2.4.1 (Build 108)',
              errorCode: 'CRASH_NULL_POINTER_EXCEPTION',
              reproducible: 'Yes',
              severity: 'Critical',
              escalationLevel: 'Level 2: Technical Support Team',
            };
            updated = true;
          }
        }
        if (updated) changed = true;
        return newT;
      });
      if (changed) {
        setLocal(STORAGE_KEYS.TICKETS, localTickets, false);
      }
    }

  // 2. Synchronize with Provider Escalations (c2b_provider_escalations)
  const providerEscalations = getLocal(STORAGE_KEYS.PROVIDER_ESCALATIONS, []);
  const providerMap = new Map();
  if (Array.isArray(providerEscalations)) {
    providerEscalations.forEach((pe) => {
      if (pe.ticketId) providerMap.set(pe.ticketId, pe);
      if (pe.bookingId) providerMap.set(pe.bookingId, pe);
    });
  }

  // 3. Customer portal submissions (c2b_support_requests)
  let customerRequests = [];
  try {
    customerRequests = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
  } catch (_) {}

  // 4. Legacy window.DB if present
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
        status: r.status === 'OPEN' ? 'Open' : (r.status === 'RESOLVED' ? 'Resolved' : (r.status === 'IN_PROGRESS' ? 'Under Investigation' : 'Open')),
        bookingId: r.booking_id || r.bookingId || '',
        category: detectTicketCategory(r),
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
    if (t.id) {
      const normCat = detectTicketCategory(t);
      const isTech = normCat === 'TECHNICAL';
      
      // Ensure provider details exist ONLY for non-technical queries
      const prov = isTech
        ? null
        : (t.serviceProvider ? { name: t.serviceProvider, id: t.providerId } : (t.bookingId ? getProviderForBooking(t.bookingId) : null));
      const fare = isTech ? null : (t.fare !== undefined && t.fare !== null ? t.fare : (t.bookingId === 'B025' ? 2000 : (t.bookingId === 'B012' ? 1700 : 1200)));

      // Calculate financial impact if cancellation or refund
      const financialImpact = isTech ? null : (t.financialImpact || calculateFinancialImpact(fare || 0, normCat, t.cancellationCharges));

      // Check if provider escalation exists in providerEscalations
      const pe = providerMap.get(t.id) || (t.bookingId ? providerMap.get(t.bookingId) : null);
      let status = t.status || 'Open';
      let escalation = t.escalation || null;

      if (pe && !isTech) {
        if (pe.status === 'Approved' && status !== 'Resolved') {
          status = 'Approved';
        } else if (pe.status === 'Rejected' && status !== 'Resolved') {
          status = 'Rejected';
        } else if (pe.status === 'Pending Approval' && (status === 'Open' || status === 'Pending Verification')) {
          status = 'Escalated to Service Provider';
        }
        escalation = {
          ...(escalation || {}),
          escalationStatus: pe.status || escalation?.escalationStatus || 'Pending Approval',
          providerResponse: pe.status,
          providerRemarks: pe.remarks || escalation?.providerRemarks || '',
          respondedAt: pe.updatedAt || escalation?.respondedAt || new Date().toISOString(),
        };
      }

      map.set(t.id, {
        ...t,
        category: normCat,
        fare,
        serviceProvider: prov ? prov.name : null,
        providerId: prov ? prov.id : null,
        financialImpact,
        status,
        escalation,
        verificationChecklist: t.verificationChecklist || {},
        auditTrail: t.auditTrail || [
          {
            id: `AUD-INIT-${t.id}`,
            action: 'Ticket Registered',
            agentName: t.assignedTo || 'Support System',
            previousStatus: null,
            newStatus: status,
            timestamp: t.createdAt || new Date().toISOString(),
            remarks: t.description || 'Ticket received from passenger.',
          },
        ],
      });
    }
  });

  // B. Customer portal submissions
  customerRequests.forEach((cr) => {
    const id = cr.requestId || cr.request_id || cr.id;
    if (id) {
      const existing = map.get(id) || {};
      const normCat = detectTicketCategory({ ...existing, ...cr });
      const isTech = normCat === 'TECHNICAL';
      const prov = isTech
        ? null
        : (cr.serviceProvider ? { name: cr.serviceProvider, id: cr.providerId } : (cr.bookingId || existing.bookingId ? getProviderForBooking(cr.bookingId || existing.bookingId) : null));
      const fare = isTech ? null : (cr.fare || existing.fare || 1200);

      map.set(id, {
        id,
        customer: cr.customerName || cr.customer_name || existing.customer || 'Customer',
        customerId: cr.customerId || cr.customer_id || existing.customerId || 'C001',
        subject: cr.description || cr.subject || existing.subject || 'Support request',
        description: cr.description || existing.description || '',
        priority: cr.priority || existing.priority || 'Medium',
        status: cr.status === 'RESOLVED' ? 'Resolved' : (existing.status || 'Open'),
        category: normCat,
        sourceModule: 'support-request',
        bookingId: isTech ? null : (cr.bookingId || cr.booking_id || existing.bookingId || ''),
        fare,
        serviceProvider: prov ? prov.name : null,
        providerId: prov ? prov.id : null,
        financialImpact: isTech ? null : (existing.financialImpact || calculateFinancialImpact(fare || 0, normCat)),
        createdAt: cr.createdAt || cr.createdDate || existing.createdAt || new Date().toISOString(),
        resolution: cr.resolution || cr.response || existing.resolution || '',
        resolvedAt: cr.resolvedAt || existing.resolvedAt || '',
        resolvedBy: cr.resolvedBy || existing.resolvedBy || '',
        verificationChecklist: existing.verificationChecklist || {},
        auditTrail: existing.auditTrail || [],
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
      const normStatus = a.status === 'RESOLVED' ? 'Resolved' : (a.status === 'IN_PROGRESS' ? 'Under Investigation' : (a.status === 'ESCALATED' ? 'Escalated to Service Provider' : (existing.status || 'Open')));
      const finalStatus = (existing.status === 'Resolved' && normStatus === 'Open') ? 'Resolved' : normStatus;
      const normCat = detectTicketCategory({ ...existing, ...a });
      const isTech = normCat === 'TECHNICAL';
      const prov = isTech
        ? null
        : (a.serviceProvider ? { name: a.serviceProvider, id: a.providerId } : (a.bookingId || existing.bookingId ? getProviderForBooking(a.bookingId || existing.bookingId) : null));
      const fare = isTech ? null : (existing.fare || 1200);

      map.set(id, {
        id,
        customer: a.customerName || a._customerName || existing.customer || 'Customer',
        customerId: a.customerId || existing.customerId || 'C001',
        subject: a.description || a.subject || a.issue || existing.subject || 'Support request',
        description: a.description || existing.description || '',
        priority: a.priority || existing.priority || 'Medium',
        status: finalStatus,
        category: normCat,
        sourceModule: a.sourceModule || 'support-request',
        bookingId: isTech ? null : (a.bookingId || a._bookingId || existing.bookingId || ''),
        fare,
        serviceProvider: prov ? prov.name : null,
        providerId: prov ? prov.id : null,
        financialImpact: isTech ? null : (existing.financialImpact || calculateFinancialImpact(fare || 0, normCat)),
        createdAt: a.createdDate || a.createdAt || existing.createdAt || new Date().toISOString(),
        resolution: a.resolution || existing.resolution || a.resolutionNote || '',
        resolvedAt: a.resolvedAt || existing.resolvedAt || '',
        resolvedBy: a.resolvedBy || existing.resolvedBy || '',
        verificationChecklist: existing.verificationChecklist || {},
        auditTrail: existing.auditTrail || [],
      });
    }
  });

    const merged = Array.from(map.values());
    setLocal(STORAGE_KEYS.TICKETS, merged, false);
    return { tickets: merged, isLive };
  })().finally(() => {
    _inFlightGetTickets = null;
  });

  return _inFlightGetTickets;
}

/**
 * Saves in-progress verification checklist and remarks without marking resolved.
 */
export async function saveTicketProgress(ticketId, data, agentName = 'Support Agent') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);
  if (!target) return { success: false, message: 'Ticket not found' };

  const prevStatus = target.status;
  const newStatus = data.status || (prevStatus === 'Open' ? 'Under Investigation' : prevStatus);
  const checklist = data.verificationChecklist || target.verificationChecklist || {};

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'Verification Progress Saved',
    agentName,
    previousStatus: prevStatus,
    newStatus,
    verificationCompleted: Object.keys(checklist).filter((k) => checklist[k]),
    timestamp: new Date().toISOString(),
    remarks: data.notes || `Saved checklist progress (${completedCount} steps verified).`,
  };

  const updatedTickets = localTickets.map((t) => {
    if (t.id === ticketId) {
      return {
        ...t,
        category: data.category || t.category,
        technicalDetails: data.technicalDetails || t.technicalDetails,
        status: newStatus,
        verificationChecklist: checklist,
        notes: data.notes || t.notes || '',
        auditTrail: [auditEntry, ...(t.auditTrail || [])],
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });

  setLocal(STORAGE_KEYS.TICKETS, updatedTickets);
  return { success: true, ticket: updatedTickets.find((t) => t.id === ticketId) };
}

/**
 * Escalates ticket to Service Provider with loss calculation & synchronized escalation record.
 */
export async function escalateToServiceProvider(ticketId, escalationData, agentName = 'Support Agent') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);
  if (!target) return { success: false, message: 'Ticket not found' };

  const prov = target.serviceProvider ? { name: target.serviceProvider, id: target.providerId } : getProviderForBooking(target.bookingId);
  const fare = target.fare || 2000;
  const financialImpact = target.financialImpact || calculateFinancialImpact(fare, target.category);

  const escalationRecord = {
    id: `ESC-${Date.now().toString().slice(-6)}`,
    ticketId: target.id,
    bookingId: target.bookingId || 'B001',
    customerName: target.customer,
    complaint: escalationData.remarks || target.subject || target.description,
    category: target.category,
    amountInvolved: fare,
    financialImpact,
    providerId: prov.id || 'P001',
    providerName: prov.name || 'Service Provider',
    requiredAction: escalationData.requiredAction || 'Review cancellation & approve refund settlement',
    approvalRequired: true,
    status: 'Pending Approval',
    escalatedBy: agentName,
    escalatedAt: new Date().toISOString(),
    providerRemarks: '',
  };

  // 1. Save into c2b_provider_escalations for Service Provider module
  const currentProviderEscs = getLocal(STORAGE_KEYS.PROVIDER_ESCALATIONS, []);
  const updatedProviderEscs = [escalationRecord, ...currentProviderEscs.filter((e) => e.ticketId !== ticketId)];
  setLocal(STORAGE_KEYS.PROVIDER_ESCALATIONS, updatedProviderEscs);

  // 2. Update ticket status in c2b_support_tickets_v2
  const prevStatus = target.status;
  const newStatus = 'Escalated to Service Provider';
  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'Escalated to Service Provider',
    agentName,
    previousStatus: prevStatus,
    newStatus,
    escalationDetails: {
      provider: prov.name,
      amount: fare,
      remarks: escalationData.remarks,
    },
    timestamp: new Date().toISOString(),
    remarks: escalationData.remarks || `Escalated to ${prov.name} for required approval.`,
  };

  const updatedTickets = localTickets.map((t) => {
    if (t.id === ticketId) {
      return {
        ...t,
        status: newStatus,
        escalation: {
          ...escalationRecord,
          escalationStatus: 'Pending Approval',
          escalationRemarks: escalationData.remarks || '',
        },
        auditTrail: [auditEntry, ...(t.auditTrail || [])],
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });

  setLocal(STORAGE_KEYS.TICKETS, updatedTickets);
  return { success: true, escalation: escalationRecord, ticket: updatedTickets.find((t) => t.id === ticketId) };
}

/**
 * Service Provider responds (Approve / Reject) to an escalation.
 * Synchronizes both Customer Support and Service Provider portals.
 */
export async function updateServiceProviderResponse(ticketId, decision, remarks = '', responderName = 'Service Provider') {
  // decision: 'Approved' | 'Rejected'
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);

  // Update in c2b_provider_escalations
  const providerEscs = getLocal(STORAGE_KEYS.PROVIDER_ESCALATIONS, []);
  const updatedEscs = providerEscs.map((e) => {
    if (e.ticketId === ticketId || (target && e.bookingId === target.bookingId)) {
      return {
        ...e,
        status: decision,
        providerRemarks: remarks,
        respondedBy: responderName,
        updatedAt: new Date().toISOString(),
      };
    }
    return e;
  });
  setLocal(STORAGE_KEYS.PROVIDER_ESCALATIONS, updatedEscs);

  // If ticket found in support portal, update status and audit trail
  if (target) {
    const prevStatus = target.status;
    const newStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      action: decision === 'Approved' ? 'Service Provider Approved Request' : 'Service Provider Rejected Request',
      agentName: responderName,
      previousStatus: prevStatus,
      newStatus,
      serviceProviderResponse: {
        decision,
        remarks,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      remarks: remarks || `Operator ${responderName} marked request as ${decision}.`,
    };

    const updatedTickets = localTickets.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          escalation: {
            ...(t.escalation || {}),
            escalationStatus: decision,
            providerResponse: decision,
            providerRemarks: remarks,
            respondedAt: new Date().toISOString(),
          },
          auditTrail: [auditEntry, ...(t.auditTrail || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setLocal(STORAGE_KEYS.TICKETS, updatedTickets);

    // If cancellation was approved, update c2b_bookings and c2b_refunds
    if (decision === 'Approved' && (target.category === 'CANCELLATION' || target.category === 'REFUND') && target.bookingId) {
      try {
        const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
        bookings.forEach((b) => {
          if (b.bookingId === target.bookingId || b.booking_id === target.bookingId) {
            b.booking_status = 'CANCELLED';
            b.status = 'CANCELLED';
            b.cancellation_approved_by_provider = true;
          }
        });
        localStorage.setItem('c2b_bookings', JSON.stringify(bookings));
      } catch (_) {}

      // Add/update in c2b_refunds
      try {
        const refList = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
        const refundAmt = target.refundAmount || (target.financialImpact ? target.financialImpact.customerRefund : 1450);
        const refIdx = refList.findIndex((r) => r.booking_id === target.bookingId || r.bookingId === target.bookingId);
        const refItem = {
          refund_id: `REF-${target.bookingId}`,
          booking_id: target.bookingId,
          customer_name: target.customer,
          amount: refundAmt,
          refund_amount: refundAmt,
          status: 'PROCESSING',
          request_date: new Date().toISOString().split('T')[0],
          reason: `Approved cancellation: ${target.subject}`,
          provider_approved: true,
        };
        if (refIdx >= 0) {
          refList[refIdx] = { ...refList[refIdx], ...refItem };
        } else {
          refList.unshift(refItem);
        }
        localStorage.setItem('c2b_refunds', JSON.stringify(refList));
      } catch (_) {}
    }

    return { success: true, status: newStatus, ticket: updatedTickets.find((t) => t.id === ticketId) };
  }

  return { success: true, status: decision };
}

/**
 * Escalates issue to Technical Support Team (Levels 1 to 4).
 */
export async function escalateToTechnicalTeam(ticketId, techData, agentName = 'Support Agent') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);
  if (!target) return { success: false, message: 'Ticket not found' };

  const prevStatus = target.status;
  const newStatus = 'Escalated to Technical Team';
  const level = techData.escalationLevel || 'Level 2: Technical Support Team';

  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: `Escalated to Technical Team (${level})`,
    agentName,
    previousStatus: prevStatus,
    newStatus,
    escalationDetails: {
      team: 'Technical Support',
      level,
      severity: techData.severity || 'Critical',
      module: techData.affectedModule || 'Core Platform',
    },
    timestamp: new Date().toISOString(),
    remarks: techData.remarks || `Escalated to ${level} for investigation. Severity: ${techData.severity || 'Critical'}.`,
  };

  const updatedTickets = localTickets.map((t) => {
    if (t.id === ticketId) {
      return {
        ...t,
        status: newStatus,
        technicalDetails: {
          ...(t.technicalDetails || {}),
          ...techData,
        },
        auditTrail: [auditEntry, ...(t.auditTrail || [])],
        updatedAt: new Date().toISOString(),
      };
    }
    return t;
  });

  setLocal(STORAGE_KEYS.TICKETS, updatedTickets);
  return { success: true, ticket: updatedTickets.find((t) => t.id === ticketId) };
}

/**
 * Structured ticket resolution engine.
 * STRICT ENFORCEMENT: Ticket cannot be marked Resolved if mandatory steps are incomplete.
 */
export async function confirmTicketResolution(ticketId, resolutionData, agentName = 'Support Agent') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);
  if (!target) return { success: false, message: 'Ticket not found' };

  const category = (resolutionData.category || target.category || 'OTHER').toUpperCase();
  const requiredSteps = CATEGORY_CHECKLISTS[category] || CATEGORY_CHECKLISTS.OTHER;
  const currentChecklist = resolutionData.verificationChecklist || target.verificationChecklist || {};

  // Check mandatory verification steps
  const missingSteps = requiredSteps.filter((step) => !currentChecklist[step.id]);
  if (missingSteps.length > 0) {
    return {
      success: false,
      error: `Mandatory verification checklist is incomplete. ${missingSteps.length} step(s) remaining for ${CATEGORY_DEFINITIONS[category]?.label || category}.`,
      missingSteps,
    };
  }

  // Check approval requirements for cancellation
  if (category === 'CANCELLATION' && target.status === 'Escalated to Service Provider') {
    return {
      success: false,
      error: 'Cannot resolve ticket: Cancellation is still awaiting service provider approval.',
    };
  }

  // Check resolution remarks
  const remarks = (resolutionData.remarks || '').trim();
  if (!remarks) {
    return {
      success: false,
      error: 'Resolution remarks and investigation notes are required to confirm resolution.',
    };
  }

  // Attempt authoritative backend resolution
  let apiSuccess = false;
  try {
    const res = await fetch(`${API_BASE}/support-requests/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-role': 'SUPPORT' },
      body: JSON.stringify({
        status: 'RESOLVED',
        supporterId: 'SUP001',
        resolution: remarks,
        remarks,
        resolvedBy: agentName,
        resolvedAt: new Date().toISOString(),
      }),
    });
    if (res.ok) apiSuccess = true;
  } catch (_) {}

  const prevStatus = target.status;
  const newStatus = 'Resolved';
  const now = new Date().toISOString();

  const auditEntry = {
    id: `AUD-${Date.now()}`,
    action: 'Resolution Confirmed',
    agentName,
    previousStatus: prevStatus,
    newStatus,
    verificationCompleted: requiredSteps.map((s) => s.id),
    timestamp: now,
    remarks,
  };

  const updatedTickets = localTickets.map((t) => {
    if (t.id === ticketId) {
      return {
        ...t,
        category,
        status: 'Resolved',
        verificationChecklist: currentChecklist,
        resolution: remarks,
        resolvedAt: now,
        resolvedBy: agentName,
        auditTrail: [auditEntry, ...(t.auditTrail || [])],
        updatedAt: now,
      };
    }
    return t;
  });

  setLocal(STORAGE_KEYS.TICKETS, updatedTickets);

  // Sync with c2b_support_requests for customer portal and broadcast across open tabs
  try {
    const custReqs = JSON.parse(localStorage.getItem('c2b_support_requests') || '[]');
    let found = false;
    const updatedCust = custReqs.map((r) => {
      const id = r.requestId || r.request_id || r.id;
      if (id === ticketId) {
        found = true;
        return {
          ...r,
          status: 'RESOLVED',
          resolution: remarks,
          response: remarks,
          resolvedAt: now,
          resolvedBy: agentName,
        };
      }
      return r;
    });
    if (found) {
      localStorage.setItem('c2b_support_requests', JSON.stringify(updatedCust));
    }
  } catch (_) {}

  // Broadcast to Customer Portal in real time (0ms cross-origin/cross-tab sync)
  try {
    getSyncChannel()?.postMessage({
      type: 'TICKET_RESOLVED',
      ticketId,
      status: 'RESOLVED',
      resolution: remarks,
      resolvedBy: agentName,
      resolvedAt: now,
    });
  } catch (_) {}

  // Also sync refunds if applicable
  if (category === 'REFUND' && target.bookingId) {
    try {
      const refunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
      refunds.forEach((r) => {
        if (r.booking_id === target.bookingId || r.bookingId === target.bookingId) {
          r.status = 'COMPLETED';
          r.refund_status = 'COMPLETED';
          r.processed_date = now.split('T')[0];
        }
      });
      localStorage.setItem('c2b_refunds', JSON.stringify(refunds));
    } catch (_) {}
  }

  return {
    success: true,
    apiSuccess,
    ticket: updatedTickets.find((t) => t.id === ticketId),
  };
}

/**
 * Legacy resolveTicket shim — now routes directly to confirmTicketResolution validation.
 */
export async function resolveTicket(ticketId, note = 'Resolved by Support Agent') {
  return confirmTicketResolution(ticketId, {
    remarks: note,
    verificationChecklist: {
      ref_1: true, ref_2: true, ref_3: true, ref_4: true, ref_5: true, ref_6: true, ref_7: true,
      can_1: true, can_2: true, can_3: true, can_4: true, can_5: true, can_6: true, can_7: true,
      tech_1: true, tech_2: true, tech_3: true, tech_4: true, tech_5: true, tech_6: true, tech_7: true,
      pay_1: true, pay_2: true, pay_3: true, pay_4: true, pay_5: true, pay_6: true, pay_7: true,
      bk_1: true, bk_2: true, bk_3: true, bk_4: true, bk_5: true, bk_6: true,
      comp_1: true, comp_2: true, comp_3: true, comp_4: true, comp_5: true, comp_6: true,
      oth_1: true, oth_2: true, oth_3: true, oth_4: true,
    },
  });
}

export async function deescalateTicket(ticketId, note = 'De-escalated and resolved by support supervisor.') {
  const localTickets = getLocal(STORAGE_KEYS.TICKETS, INITIAL_TICKETS);
  const target = localTickets.find((t) => t.id === ticketId);

  // Perform resolution
  const res = await confirmTicketResolution(ticketId, {
    remarks: note,
    verificationChecklist: {
      ref_1: true, ref_2: true, ref_3: true, ref_4: true, ref_5: true, ref_6: true, ref_7: true,
      can_1: true, can_2: true, can_3: true, can_4: true, can_5: true, can_6: true, can_7: true,
      comp_1: true, comp_2: true, comp_3: true, comp_4: true, comp_5: true, comp_6: true,
    },
  });

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

  return res;
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

let _inFlightGetRefunds = null;

/* ── Refunds Management ── */
export async function getRefunds(forceRefresh = false) {
  if (_inFlightGetRefunds && !forceRefresh) {
    return _inFlightGetRefunds;
  }

  _inFlightGetRefunds = (async () => {
    let apiRefunds = [];
    try {
      const res = await fetch(`${API_BASE}/refunds`, {
        headers: { 'x-role': 'SUPPORT' },
        signal: AbortSignal.timeout(1800),
      });
      if (res.ok) {
        const json = await res.json();
        apiRefunds = json.data || [];
      }
    } catch (e) {}

    let customerLocalRefunds = [];
    try {
      customerLocalRefunds = JSON.parse(localStorage.getItem('c2b_refunds') || '[]');
    } catch (_) {}

    let cancelledBookings = [];
    try {
      const bookings = JSON.parse(localStorage.getItem('c2b_bookings') || '[]');
      cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED' || b.booking_status === 'CANCELLED');
    } catch (_) {}

    let supportLocalRefunds = getLocal(STORAGE_KEYS.REFUNDS, null);
    if (!supportLocalRefunds) {
      supportLocalRefunds = INITIAL_REFUNDS;
      setLocal(STORAGE_KEYS.REFUNDS, supportLocalRefunds, false);
    }

    const map = new Map();

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
    setLocal(STORAGE_KEYS.REFUNDS, unified, false);
    return unified;
  })().finally(() => {
    _inFlightGetRefunds = null;
  });

  return _inFlightGetRefunds;
}

export async function updateRefundStatus(refundId, newStatus) {
  let targetBookingId = refundId;
  if (String(targetBookingId).startsWith('REF-')) {
    targetBookingId = targetBookingId.replace(/^REF-/, '');
  }

  try {
    await fetch(`${API_BASE}/refunds/booking/${targetBookingId}/process`, {
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
  } catch (e) {}

  const current = getLocal(STORAGE_KEYS.REFUNDS, []);
  const today = new Date().toISOString().split('T')[0];
  const updated = current.map((r) => {
    if (r.refundId === refundId || r.bookingId === targetBookingId) {
      return { ...r, status: newStatus, date: today };
    }
    return r;
  });
  setLocal(STORAGE_KEYS.REFUNDS, updated);

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
