/**
 * Backend bridge for the Super Admin console.
 *
 * The console reads records synchronously from the localStorage DB (./index),
 * so that store is kept as a cache of the NestJS backend:
 *   - pullAll() replaces every cached table with the backend's rows
 *   - remoteSave() / remoteDelete() write to the backend first and only then
 *     touch the cache, so a change made here reaches the Admin, Customer,
 *     Provider and Support portals (they all read the same backend).
 *
 * Backend records are camelCase, the console's schemas are snake_case; rows
 * are converted at this boundary. Each create/update sends only the fields
 * the backend DTO accepts (the API rejects unknown properties).
 */
import { apiRequest } from '../http';

const toSnake = (key) => key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

const rowToLocal = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [toSnake(k), v]));

/** Pick `fields` (camelCase) out of a snake_case form, dropping empty values. */
const pick = (form, fields) =>
  Object.fromEntries(
    fields
      .map((f) => [f, form[toSnake(f)]])
      .filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );

const call = (path, { role = 'ADMIN', ...opts } = {}) => apiRequest(path, { role, ...opts });

/**
 * Per-table backend endpoints. `create`, `update` and `remove` are omitted
 * where the backend has no matching endpoint; the console then reports the
 * operation as unsupported instead of silently changing only this browser.
 */
const TABLES = {
  customers: {
    list: '/customers',
    create: (f) => call('/customers', { method: 'POST', body: pick(f, ['name', 'email', 'password', 'age', 'gender', 'phoneNumber']) }),
    update: (id, f) => call(`/customers/${id}`, { method: 'PUT', body: pick(f, ['name', 'email', 'age', 'gender', 'phoneNumber']) }),
    remove: (id) => call(`/customers/${id}`, { method: 'DELETE' }),
  },
  admins: {
    list: '/admin',
    create: (f) => call('/admin', { method: 'POST', body: pick(f, ['name', 'email', 'password']) }),
  },
  serviceProviders: {
    list: '/providers',
    create: (f) => call('/providers', { method: 'POST', body: pick(f, ['name', 'email', 'password']) }),
    // PUT /providers/:id is restricted to the PROVIDER role.
    update: (id, f) => call(`/providers/${id}`, { method: 'PUT', role: 'PROVIDER', body: pick(f, ['name']) }),
    remove: (id) => call(`/providers/${id}`, { method: 'DELETE' }),
  },
  customerSupport: {
    list: '/support-staff',
    create: (f) => call('/support-staff', { method: 'POST', body: pick(f, ['name', 'email', 'password']) }),
  },
  vehicles: {
    list: '/vehicles',
    create: (f) =>
      call('/vehicles', {
        method: 'POST',
        role: 'PROVIDER',
        body: pick(f, ['providerId', 'vehicleNumber', 'vehicleType', 'totalSeats', 'remainingSeats']),
      }),
    update: (id, f) => call(`/vehicles/${id}`, { method: 'PUT', body: pick(f, ['vehicleType', 'totalSeats']) }),
    remove: (id) => call(`/vehicles/${id}`, { method: 'DELETE' }),
  },
  routes: {
    list: '/routes',
    create: (f) => call('/routes', { method: 'POST', body: pick(f, ['source', 'destination', 'distance']) }),
    update: (id, f) => call(`/routes/${id}`, { method: 'PUT', body: pick(f, ['source', 'destination', 'distance']) }),
    remove: (id) => call(`/routes/${id}`, { method: 'DELETE' }),
  },
  schedules: {
    list: '/schedules',
    create: (f) =>
      call('/schedules', {
        method: 'POST',
        role: 'PROVIDER',
        body: pick(f, ['routeId', 'providerId', 'departureTime', 'arrivalTime', 'journeyDate', 'arrivalTimeToDestination', 'fare']),
      }),
    update: (id, f) => call(`/schedules/${id}`, { method: 'PUT', body: pick(f, ['departureTime', 'fare']) }),
    remove: (id) => call(`/schedules/${id}`, { method: 'DELETE' }),
  },
  trips: {
    list: '/trips',
    create: (f) => call('/trips', { method: 'POST', role: 'PROVIDER', body: pick(f, ['scheduleId', 'vehicleId']) }),
    update: (id, f) => call(`/trips/${id}/status`, { method: 'PATCH', body: pick(f, ['tripStatus']) }),
  },
  offers: {
    list: '/offers',
    create: (f) =>
      call('/offers', {
        method: 'POST',
        role: 'PROVIDER',
        body: pick(f, ['providerId', 'offerCode', 'discountPercentage', 'startDate', 'endDate']),
      }),
    update: (id, f) => call(`/offers/${id}`, { method: 'PUT', body: pick(f, ['status', 'endDate']) }),
    remove: (id) => call(`/offers/${id}`, { method: 'DELETE' }),
  },
  bookings: {
    list: '/bookings',
    // Bookings change state only through their lifecycle endpoints, which
    // also release seats, update the ledger and raise support tickets.
    update: async (id, f, prev) => {
      const status = f.booking_status;
      if (!status || status === prev?.booking_status) return null;
      if (status === 'CONFIRMED') return call(`/bookings/${id}/confirm`, { method: 'PATCH' });
      if (status === 'CANCELLED') return call('/cancellations', { method: 'POST', body: { bookingId: id } });
      throw new Error(`Bookings can only be confirmed or cancelled (not set to ${status}).`);
    },
  },
  payments: { list: '/payments' },
  cancellations: {
    list: '/cancellations',
    create: (f) => call('/cancellations', { method: 'POST', body: pick(f, ['bookingId']) }),
  },
  refunds: {
    list: '/refunds',
    update: (id, f) =>
      call(`/refunds/booking/${id}/process`, {
        method: 'PATCH',
        body: pick(f, ['adminId', 'refundStatus']),
      }),
  },
  reviews: {
    list: '/reviews',
    remove: (id) => call(`/reviews/${id}`, { method: 'DELETE' }),
  },
  supportRequests: {
    list: '/support-requests',
    update: (id, f) => call(`/support-requests/${id}`, { method: 'PATCH', body: pick(f, ['supporterId', 'status']) }),
  },
};

export const isRemoteTable = (dbKey) => Boolean(TABLES[dbKey]);

/** Operations the backend supports for a table: { create, update, remove }. */
export const remoteCapabilities = (dbKey) => {
  const t = TABLES[dbKey] || {};
  return { create: Boolean(t.create), update: Boolean(t.update), remove: Boolean(t.remove) };
};

function replaceTable(dbKey, rows) {
  try {
    localStorage.setItem('c2b_' + dbKey, JSON.stringify(rows.map(rowToLocal)));
  } catch (e) {
    console.warn(`[DB] Failed to cache "${dbKey}":`, e);
  }
}

/**
 * Refresh every cached table from the backend. Resolves to
 * { ok, failed: [dbKey…], offline } — tables that fail keep their cached rows.
 */
export async function pullAll() {
  const entries = Object.entries(TABLES);
  const results = await Promise.allSettled(entries.map(([, t]) => call(t.list)));
  const failed = [];
  let offline = false;
  results.forEach((res, i) => {
    const [dbKey] = entries[i];
    if (res.status === 'fulfilled' && Array.isArray(res.value)) replaceTable(dbKey, res.value);
    else {
      failed.push(dbKey);
      if (res.reason instanceof TypeError) offline = true;
    }
  });
  return { ok: failed.length === 0, failed, offline };
}

async function pullTable(dbKey) {
  const rows = await call(TABLES[dbKey].list);
  if (Array.isArray(rows)) replaceTable(dbKey, rows);
}

const fail = (error) => ({ success: false, error });

/** Create (`prev` null) or update a record on the backend, then refresh its cache. */
export async function remoteSave(dbKey, pk, form, prev) {
  const t = TABLES[dbKey];
  if (!t) return fail(`"${dbKey}" is not connected to the backend.`);
  const op = prev ? t.update : t.create;
  if (!op) return fail(`The backend does not support ${prev ? 'editing' : 'adding'} ${dbKey} from this console.`);
  try {
    await (prev ? op(pk, form, prev) : op(form));
    await pullTable(dbKey);
    return { success: true, message: `Saved to backend — visible in every portal.` };
  } catch (e) {
    return fail(e.message || 'Backend request failed.');
  }
}

export async function remoteDelete(dbKey, pk) {
  const t = TABLES[dbKey];
  if (!t?.remove) return fail(`The backend does not support deleting ${dbKey}.`);
  try {
    await t.remove(pk);
    await pullTable(dbKey);
    return { success: true, message: 'Deleted from backend — removed in every portal.' };
  } catch (e) {
    return fail(e.message || 'Backend request failed.');
  }
}
