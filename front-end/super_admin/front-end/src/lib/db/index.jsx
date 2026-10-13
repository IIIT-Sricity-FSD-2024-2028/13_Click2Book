/**
 * ============================================================
 *  CLICK2BOOK — CRUD Engine with localStorage Persistence
 *
 *  HOW IT WORKS:
 *    1. On first load: seeds localStorage from mockData.js arrays
 *    2. On subsequent loads: reads entirely from localStorage
 *    3. Every mutation (create/update/delete) saves back to localStorage
 *
 *  USAGE:
 *    DB.bookings.create({...})       → creates + auto-persists
 *    DB.bookings.update(id, {...})   → updates + auto-persists
 *    DB.bookings.delete(id)          → deletes + auto-persists
 *    DB.bookings.getAll()            → returns current state
 *    DB.bookings.getById(id)         → returns single record
 *    DB.bookings.find(fn)            → filter by predicate
 *    DB.resetAll()                   → wipe localStorage, re-seed from mockData.js
 * ============================================================
 */
import * as seed from './mockData';
import { localISODate } from '../dates';

/* ── Storage Key Namespace ──────────────────────────────────── */
const STORAGE_PREFIX = 'c2b_';

/* ── Helpers ─────────────────────────────────────────────────── */

/** Load a table from localStorage. Returns null if the key doesn't exist yet. */
function storageLoad(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`[DB] Failed to load "${key}" from localStorage:`, e);
    return null;
  }
}

/** Save a table array to localStorage. */
function storageSave(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[DB] Failed to save "${key}" to localStorage:`, e);
  }
}

/** Seed a table from mockData.js ONLY if this is the first time (key not present yet). */
function storageSeedIfEmpty(key, seedArray) {
  if (localStorage.getItem(STORAGE_PREFIX + key) === null) {
    storageSave(key, seedArray);
    console.info(`[DB] Seeded "${key}" with ${seedArray.length} records from mock data.`);
  }
}

const today = () => localISODate();

/* ── Generic localStorage CRUD Factory ──────────────────────── */

/**
 * Creates a fully-persistent CRUD interface for one table.
 *
 * @param {string} storageKey  - localStorage namespace key (e.g. "bookings")
 * @param {string} pkField     - Primary key field name   (e.g. "booking_id")
 * @param {Array}  seedData    - Initial array from mockData.js (used once)
 */
function createCRUD(storageKey, pkField, seedData) {
  storageSeedIfEmpty(storageKey, seedData);

  const _getData = () => storageLoad(storageKey) || [];
  const _save = (data) => storageSave(storageKey, data);

  function matchPk(r, id) {
    if (!r) return false;
    if (r[pkField] === id) return true;
    if (pkField === 'booking_id' && (r.bookingId === id || r.booking_id === id)) return true;
    if (pkField === 'customer_id' && (r.customerId === id || r.customer_id === id || r.id === id)) return true;
    return false;
  }

  const notFound = (id) => ({ success: false, error: `No "${storageKey}" record with ${pkField} = "${id}"` });

  // ── READ ────────────────────────────────────────────────────

  /** Return a shallow copy of all records */
  function getAll() {
    return [..._getData()];
  }

  /** Find a single record by primary key */
  function getById(id) {
    const record = _getData().find((r) => matchPk(r, id));
    return record ? { success: true, data: { ...record } } : notFound(id);
  }

  /** Find records matching a predicate */
  function find(predicate) {
    return _getData()
      .filter(predicate)
      .map((r) => ({ ...r }));
  }

  // ── CREATE ──────────────────────────────────────────────────

  function create(record) {
    const id = record[pkField] || (pkField === 'booking_id' ? record.bookingId : null);
    if (!id) {
      return { success: false, error: `Primary key "${pkField}" is required.` };
    }
    const data = _getData();
    const existingIndex = data.findIndex((r) => matchPk(r, id));

    // Normalize booking aliases if table is bookings
    const newRecord = { ...record };
    if (storageKey === 'bookings') {
      newRecord.booking_id = newRecord.booking_id || newRecord.bookingId || id;
      newRecord.bookingId = newRecord.bookingId || newRecord.booking_id;
      newRecord.customer_id = newRecord.customer_id || newRecord.customerId;
      newRecord.customerId = newRecord.customerId || newRecord.customer_id;
      newRecord.booking_status = newRecord.booking_status || newRecord.status || 'CONFIRMED';
      newRecord.status = newRecord.status || newRecord.booking_status || 'CONFIRMED';
    }

    if (existingIndex !== -1) {
      data[existingIndex] = { ...data[existingIndex], ...newRecord };
      _save(data);
      return { success: true, data: { ...data[existingIndex] }, message: `Record updated in ${storageKey}.` };
    }

    data.unshift(newRecord);
    _save(data);
    return { success: true, data: { ...newRecord }, message: `Record created in ${storageKey}.` };
  }

  // ── UPDATE ──────────────────────────────────────────────────

  function update(id, changes) {
    const data = _getData();
    const index = data.findIndex((r) => matchPk(r, id));
    if (index === -1) return notFound(id);

    // Never overwrite the primary key
    const safeChanges = { ...changes };
    delete safeChanges[pkField];
    if (pkField === 'booking_id') delete safeChanges.bookingId;

    if (storageKey === 'bookings') {
      if (safeChanges.booking_status) safeChanges.status = safeChanges.booking_status;
      if (safeChanges.status) safeChanges.booking_status = safeChanges.status;
    }

    data[index] = { ...data[index], ...safeChanges };
    _save(data);
    return { success: true, data: { ...data[index] }, message: `Record updated in ${storageKey}.` };
  }

  // ── DELETE ──────────────────────────────────────────────────

  function remove(id) {
    const data = _getData();
    const index = data.findIndex((r) => matchPk(r, id));
    if (index === -1) return notFound(id);
    const deleted = data.splice(index, 1)[0];
    _save(data);
    return { success: true, data: { ...deleted }, message: `Record deleted from ${storageKey}.` };
  }

  return { getAll, getById, find, create, update, delete: remove };
}

/**
 * CRUD interface for a table with a two-column primary key
 * (SEAT: vehicle_id + seat_number, REPORT: admin_id + report_date).
 */
function createCompositeCRUD(storageKey, [keyA, keyB], seedData, labels) {
  storageSeedIfEmpty(storageKey, seedData);

  const _getData = () => storageLoad(storageKey) || [];
  const _save = (data) => storageSave(storageKey, data);
  const matches = (a, b) => (r) => r[keyA] === a && r[keyB] === b;

  return {
    getAll() {
      return [..._getData()];
    },

    getById(a, b) {
      const r = _getData().find(matches(a, b));
      if (!r) return { success: false, error: labels.notFound(a, b) };
      return { success: true, data: { ...r } };
    },

    find(predicate) {
      return _getData()
        .filter(predicate)
        .map((r) => ({ ...r }));
    },

    create(record) {
      if (!record[keyA] || record[keyB] == null || record[keyB] === '') {
        return { success: false, error: `${keyA} and ${keyB} are required.` };
      }
      const data = _getData();
      if (data.find(matches(record[keyA], record[keyB]))) {
        return { success: false, error: labels.duplicate(record[keyA], record[keyB]) };
      }
      const newRecord = { ...record };
      data.push(newRecord);
      _save(data);
      return { success: true, data: { ...newRecord }, message: `${labels.noun} created.` };
    },

    update(a, b, changes) {
      const data = _getData();
      const index = data.findIndex(matches(a, b));
      if (index === -1) return { success: false, error: `${labels.noun} not found.` };
      data[index] = { ...data[index], ...changes };
      _save(data);
      return { success: true, data: { ...data[index] }, message: `${labels.noun} updated.` };
    },

    delete(a, b) {
      const data = _getData();
      const index = data.findIndex(matches(a, b));
      if (index === -1) return { success: false, error: `${labels.noun} not found.` };
      const deleted = data.splice(index, 1)[0];
      _save(data);
      return { success: true, data: { ...deleted }, message: `${labels.noun} deleted.` };
    },
  };
}

/* ── DB — Central Database Object ─────────────────────────── */

const TABLES = [
  ['customers', 'customer_id'],
  ['admins', 'admin_id'],
  ['serviceProviders', 'provider_id'],
  ['customerSupport', 'supporter_id'],
  ['vehicles', 'vehicle_id'],
  ['routes', 'route_id'],
  ['schedules', 'schedule_id'],
  ['trips', 'trip_id'],
  ['offers', 'offer_id'],
  ['irctcRecords', 'irctc_id'],
  ['bookings', 'booking_id'],
  ['payments', 'payment_id'],
  ['cancellations', 'booking_id'],
  ['refunds', 'booking_id'],
  ['reviews', 'review_id'],
  ['supportRequests', 'request_id'],
];

export const DB = {};
for (const [key, pk] of TABLES) DB[key] = createCRUD(key, pk, seed[key]);

DB.seats = createCompositeCRUD('seats', ['vehicle_id', 'seat_number'], seed.seats, {
  noun: 'Seat',
  notFound: (v, n) => `Seat ${n} not found in ${v}`,
  duplicate: (v, n) => `Seat ${n} already exists in ${v}.`,
});

DB.reports = createCompositeCRUD('reports', ['admin_id', 'report_date'], seed.reports, {
  noun: 'Report',
  notFound: (a, d) => `Report not found for ${a} on ${d}`,
  duplicate: () => 'Report already exists for this admin on this date.',
});

/* ── Domain-Specific Query Helpers ─────────────────────────── */

/** Full booking details (joins booking + customer + trip + offer + payment) */
DB.getBookingDetails = function (booking_id) {
  const bookingResult = DB.bookings.getById(booking_id);
  if (!bookingResult.success) return bookingResult;

  const b = bookingResult.data;
  const customerResult = DB.customers.getById(b.customer_id);
  const tripResult = DB.trips.getById(b.trip_id);
  const offerResult = b.offer_id ? DB.offers.getById(b.offer_id) : { success: false };
  const payments = DB.payments.find((p) => p.booking_id === booking_id);

  return {
    success: true,
    data: {
      booking: b,
      customer: customerResult.success ? customerResult.data : null,
      trip: tripResult.success ? tripResult.data : null,
      offer: offerResult.success ? offerResult.data : null,
      payment: payments.length > 0 ? payments[0] : null,
    },
  };
};

/** All bookings for a specific customer */
DB.getCustomerBookings = function (customer_id) {
  return DB.bookings.find((b) => b.customer_id === customer_id);
};

/** Trips with joined route, schedule, vehicle info */
DB.getTripsWithDetails = function () {
  return DB.trips.getAll().map((trip) => {
    const schedule = DB.schedules.find((sc) => sc.schedule_id === trip.schedule_id)[0] || null;
    const route = schedule ? DB.routes.find((r) => r.route_id === schedule.route_id)[0] : null;
    const vehicle = DB.vehicles.find((v) => v.vehicle_id === trip.vehicle_id)[0] || null;
    return { ...trip, schedule, route, vehicle };
  });
};

/** Available seats for a vehicle */
DB.getAvailableSeats = function (vehicle_id) {
  return DB.seats.find((s) => s.vehicle_id === vehicle_id && s.seat_status === 'AVAILABLE');
};

/** Process a new booking atomically (validates → creates booking + payment) */
DB.processNewBooking = function (bookingData, paymentData) {
  if (!DB.customers.getById(bookingData.customer_id).success) {
    return { success: false, error: `Customer "${bookingData.customer_id}" does not exist.` };
  }
  if (!DB.trips.getById(bookingData.trip_id).success) {
    return { success: false, error: `Trip "${bookingData.trip_id}" does not exist.` };
  }

  const bookingResult = DB.bookings.create({
    booking_date: today(),
    booking_status: 'PENDING',
    ...bookingData,
  });
  if (!bookingResult.success) return bookingResult;

  const paymentResult = DB.payments.create({
    ...paymentData,
    booking_id: bookingData.booking_id,
    payment_date: today(),
    payment_status: 'PENDING',
  });
  if (!paymentResult.success) {
    DB.bookings.delete(bookingData.booking_id); // rollback
    return { success: false, error: `Payment failed: ${paymentResult.error}` };
  }

  return {
    success: true,
    message: 'Booking and payment created successfully.',
    data: { booking: bookingResult.data, payment: paymentResult.data },
  };
};

/** Cancel a booking — updates status + creates cancellation record */
DB.cancelBooking = function (booking_id) {
  const result = DB.bookings.update(booking_id, { booking_status: 'CANCELLED' });
  if (!result.success) return result;
  DB.cancellations.create({ booking_id, cancel_date: today() });
  return { success: true, message: `Booking ${booking_id} cancelled.` };
};

/* ── Reset — wipe localStorage & re-seed from mockData.js ─── */

/** Reset every table back to the original mock data. */
DB.resetAll = function () {
  const tables = [...TABLES.map(([key]) => key), 'seats', 'reports'];
  for (const key of tables) {
    localStorage.removeItem(STORAGE_PREFIX + key);
    storageSave(key, seed[key]);
  }
  console.info('[DB] Database reset to mock data.');
  return { success: true, message: 'Database reset to original mock data.' };
};

// Expose for the browser console, as the original script.js did.
window.DB = DB;

export default DB;
