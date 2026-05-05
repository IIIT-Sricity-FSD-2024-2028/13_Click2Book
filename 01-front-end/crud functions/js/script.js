/**
 * ============================================================
 *  CLICK2BOOK — CRUD Engine with localStorage Persistence
 *
 *  HOW IT WORKS:
 *    1. On first load: seeds localStorage from mock_data.js arrays
 *    2. On subsequent loads: reads entirely from localStorage
 *    3. Every mutation (create/update/delete) saves back to localStorage
 *
 *  USAGE:
 *    DB.bookings.create({...})       → creates + auto-persists
 *    DB.bookings.update(id, {...})   → updates + auto-persists
 *    DB.bookings.delete(id)         → deletes + auto-persists
 *    DB.bookings.getAll()           → returns current state
 *    DB.bookings.getById(id)        → returns single record
 *    DB.bookings.find(fn)           → filter by predicate
 *    DB.resetAll()                  → wipe localStorage, re-seed from mock_data.js
 * ============================================================
 */

/* ── Storage Key Namespace ──────────────────────────────────── */
const STORAGE_PREFIX = "c2b_";

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Load a table from localStorage.
 * Returns null if the key doesn't exist yet.
 */
function storageLoad(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`[DB] Failed to load "${key}" from localStorage:`, e);
    return null;
  }
}

/**
 * Save a table array to localStorage.
 */
function storageSave(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[DB] Failed to save "${key}" to localStorage:`, e);
  }
}

/**
 * Seed a table into localStorage from the mock_data.js array
 * ONLY if this is the first time (key not present yet).
 */
function storageSeedIfEmpty(key, seedArray) {
  if (localStorage.getItem(STORAGE_PREFIX + key) === null) {
    storageSave(key, seedArray);
    console.info(`[DB] Seeded "${key}" with ${seedArray.length} records from mock data.`);
  }
}


/* ── Generic localStorageCRUD Factory ───────────────────────── */

/**
 * Creates a fully-persistent CRUD interface for one table.
 *
 * @param {string} storageKey  - localStorage namespace key (e.g. "bookings")
 * @param {string} pkField     - Primary key field name   (e.g. "booking_id")
 * @param {Array}  seedData    - Initial array from mock_data.js (used once)
 */
function createCRUD(storageKey, pkField, seedData) {

  // Seed once on first ever visit
  storageSeedIfEmpty(storageKey, seedData);

  /** Get the live array from localStorage */
  function _getData() {
    return storageLoad(storageKey) || [];
  }

  /** Save the live array back to localStorage */
  function _save(data) {
    storageSave(storageKey, data);
  }

  // ── READ ────────────────────────────────────────────────────

  /** Return a shallow copy of all records */
  function getAll() {
    return [..._getData()];
  }

  /** Find a single record by primary key */
  function getById(id) {
    const record = _getData().find(r => r[pkField] === id);
    if (!record) {
      return { success: false, error: `No "${storageKey}" record with ${pkField} = "${id}"` };
    }
    return { success: true, data: { ...record } };
  }

  /** Find records matching a predicate */
  function find(predicate) {
    return _getData().filter(predicate).map(r => ({ ...r }));
  }

  // ── CREATE ──────────────────────────────────────────────────

  function create(record) {
    if (!record[pkField]) {
      return { success: false, error: `Primary key "${pkField}" is required.` };
    }
    const data = _getData();
    if (data.find(r => r[pkField] === record[pkField])) {
      return { success: false, error: `"${record[pkField]}" already exists in ${storageKey}.` };
    }
    const newRecord = { ...record };
    data.push(newRecord);
    _save(data);
    return { success: true, data: { ...newRecord }, message: `Record created in ${storageKey}.` };
  }

  // ── UPDATE ──────────────────────────────────────────────────

  function update(id, changes) {
    const data  = _getData();
    const index = data.findIndex(r => r[pkField] === id);
    if (index === -1) {
      return { success: false, error: `No "${storageKey}" record with ${pkField} = "${id}"` };
    }
    // Never overwrite the primary key
    const safeChanges = { ...changes };
    delete safeChanges[pkField];
    data[index] = { ...data[index], ...safeChanges };
    _save(data);
    return { success: true, data: { ...data[index] }, message: `Record updated in ${storageKey}.` };
  }

  // ── DELETE ──────────────────────────────────────────────────

  function remove(id) {
    const data  = _getData();
    const index = data.findIndex(r => r[pkField] === id);
    if (index === -1) {
      return { success: false, error: `No "${storageKey}" record with ${pkField} = "${id}"` };
    }
    const deleted = data.splice(index, 1)[0];
    _save(data);
    return { success: true, data: { ...deleted }, message: `Record deleted from ${storageKey}.` };
  }

  return { getAll, getById, find, create, update, delete: remove };
}


/* ── DB — Central Database Object ─────────────────────────── */

const DB = {
  customers:        createCRUD("customers",        "customer_id",   customers),
  admins:           createCRUD("admins",            "admin_id",      admins),
  serviceProviders: createCRUD("serviceProviders",  "provider_id",   serviceProviders),
  customerSupport:  createCRUD("customerSupport",   "supporter_id",  customerSupport),
  vehicles:         createCRUD("vehicles",          "vehicle_id",    vehicles),
  routes:           createCRUD("routes",            "route_id",      routes),
  schedules:        createCRUD("schedules",         "schedule_id",   schedules),
  trips:            createCRUD("trips",             "trip_id",       trips),
  offers:           createCRUD("offers",            "offer_id",      offers),
  irctcRecords:     createCRUD("irctcRecords",      "irctc_id",      irctcRecords),
  bookings:         createCRUD("bookings",          "booking_id",    bookings),
  payments:         createCRUD("payments",          "payment_id",    payments),
  cancellations:    createCRUD("cancellations",     "booking_id",    cancellations),
  refunds:          createCRUD("refunds",           "booking_id",    refunds),
  reviews:          createCRUD("reviews",           "review_id",     reviews),
  supportRequests:  createCRUD("supportRequests",   "request_id",    supportRequests),
};


/* ── Composite PK: SEAT (vehicle_id + seat_number) ─────────── */

storageSeedIfEmpty("seats", seats);

DB.seats = {

  _getData() { return storageLoad("seats") || []; },
  _save(data) { storageSave("seats", data); },

  getAll() { return [...this._getData()]; },

  getById(vehicle_id, seat_number) {
    const r = this._getData().find(s => s.vehicle_id === vehicle_id && s.seat_number === seat_number);
    if (!r) return { success: false, error: `Seat ${seat_number} not found in ${vehicle_id}` };
    return { success: true, data: { ...r } };
  },

  find(predicate) { return this._getData().filter(predicate).map(s => ({ ...s })); },

  create(record) {
    if (!record.vehicle_id || record.seat_number == null) {
      return { success: false, error: "vehicle_id and seat_number are required." };
    }
    const data = this._getData();
    if (data.find(s => s.vehicle_id === record.vehicle_id && s.seat_number === record.seat_number)) {
      return { success: false, error: `Seat ${record.seat_number} already exists in ${record.vehicle_id}.` };
    }
    const newRecord = { ...record };
    data.push(newRecord);
    this._save(data);
    return { success: true, data: { ...newRecord }, message: "Seat created." };
  },

  update(vehicle_id, seat_number, changes) {
    const data  = this._getData();
    const index = data.findIndex(s => s.vehicle_id === vehicle_id && s.seat_number === seat_number);
    if (index === -1) return { success: false, error: "Seat not found." };
    data[index] = { ...data[index], ...changes };
    this._save(data);
    return { success: true, data: { ...data[index] }, message: "Seat updated." };
  },

  delete(vehicle_id, seat_number) {
    const data  = this._getData();
    const index = data.findIndex(s => s.vehicle_id === vehicle_id && s.seat_number === seat_number);
    if (index === -1) return { success: false, error: "Seat not found." };
    const deleted = data.splice(index, 1)[0];
    this._save(data);
    return { success: true, data: { ...deleted }, message: "Seat deleted." };
  }
};


/* ── Composite PK: REPORT (admin_id + report_date) ─────────── */

storageSeedIfEmpty("reports", reports);

DB.reports = {

  _getData() { return storageLoad("reports") || []; },
  _save(data) { storageSave("reports", data); },

  getAll() { return [...this._getData()]; },

  getById(admin_id, report_date) {
    const r = this._getData().find(r => r.admin_id === admin_id && r.report_date === report_date);
    if (!r) return { success: false, error: `Report not found for ${admin_id} on ${report_date}` };
    return { success: true, data: { ...r } };
  },

  find(predicate) { return this._getData().filter(predicate).map(r => ({ ...r })); },

  create(record) {
    if (!record.admin_id || !record.report_date) {
      return { success: false, error: "admin_id and report_date are required." };
    }
    const data = this._getData();
    if (data.find(r => r.admin_id === record.admin_id && r.report_date === record.report_date)) {
      return { success: false, error: "Report already exists for this admin on this date." };
    }
    const newRecord = { ...record };
    data.push(newRecord);
    this._save(data);
    return { success: true, data: { ...newRecord }, message: "Report created." };
  },

  update(admin_id, report_date, changes) {
    const data  = this._getData();
    const index = data.findIndex(r => r.admin_id === admin_id && r.report_date === report_date);
    if (index === -1) return { success: false, error: "Report not found." };
    data[index] = { ...data[index], ...changes };
    this._save(data);
    return { success: true, data: { ...data[index] }, message: "Report updated." };
  },

  delete(admin_id, report_date) {
    const data  = this._getData();
    const index = data.findIndex(r => r.admin_id === admin_id && r.report_date === report_date);
    if (index === -1) return { success: false, error: "Report not found." };
    const deleted = data.splice(index, 1)[0];
    this._save(data);
    return { success: true, data: { ...deleted }, message: "Report deleted." };
  }
};


/* ── Domain-Specific Query Helpers ─────────────────────────── */

/**
 * Get full booking details (joins booking + customer + trip + offer + payment)
 */
DB.getBookingDetails = function(booking_id) {
  const bookingResult = DB.bookings.getById(booking_id);
  if (!bookingResult.success) return bookingResult;

  const b             = bookingResult.data;
  const customerResult = DB.customers.getById(b.customer_id);
  const tripResult     = DB.trips.getById(b.trip_id);
  const offerResult    = b.offer_id ? DB.offers.getById(b.offer_id) : { success: false };
  const payments       = DB.payments.find(p => p.booking_id === booking_id);

  return {
    success: true,
    data: {
      booking:  b,
      customer: customerResult.success ? customerResult.data : null,
      trip:     tripResult.success     ? tripResult.data     : null,
      offer:    offerResult.success    ? offerResult.data    : null,
      payment:  payments.length > 0   ? payments[0]         : null
    }
  };
};

/** Get all bookings for a specific customer */
DB.getCustomerBookings = function(customer_id) {
  return DB.bookings.find(b => b.customer_id === customer_id);
};

/** Get trips with joined route, schedule, vehicle info */
DB.getTripsWithDetails = function() {
  return DB.trips.getAll().map(trip => {
    const schedule = DB.schedules.find(sc => sc.schedule_id === trip.schedule_id)[0] || null;
    const route    = schedule ? DB.routes.find(r => r.route_id === schedule.route_id)[0] : null;
    const vehicle  = DB.vehicles.find(v => v.vehicle_id === trip.vehicle_id)[0] || null;
    return { ...trip, schedule, route, vehicle };
  });
};

/** Get available seats for a vehicle */
DB.getAvailableSeats = function(vehicle_id) {
  return DB.seats.find(s => s.vehicle_id === vehicle_id && s.seat_status === "AVAILABLE");
};

/**
 * Process a new booking atomically (validates → creates booking + payment)
 */
DB.processNewBooking = function(bookingData, paymentData) {
  if (!DB.customers.getById(bookingData.customer_id).success) {
    return { success: false, error: `Customer "${bookingData.customer_id}" does not exist.` };
  }
  if (!DB.trips.getById(bookingData.trip_id).success) {
    return { success: false, error: `Trip "${bookingData.trip_id}" does not exist.` };
  }

  const bookingResult = DB.bookings.create({
    booking_date:   new Date().toISOString().split("T")[0],
    booking_status: "PENDING",
    ...bookingData
  });
  if (!bookingResult.success) return bookingResult;

  const paymentResult = DB.payments.create({
    ...paymentData,
    booking_id:     bookingData.booking_id,
    payment_date:   new Date().toISOString().split("T")[0],
    payment_status: "PENDING"
  });
  if (!paymentResult.success) {
    DB.bookings.delete(bookingData.booking_id); // rollback
    return { success: false, error: `Payment failed: ${paymentResult.error}` };
  }

  return {
    success: true,
    message: "Booking and payment created successfully.",
    data:    { booking: bookingResult.data, payment: paymentResult.data }
  };
};

/**
 * Cancel a booking — updates status + creates cancellation record
 */
DB.cancelBooking = function(booking_id) {
  const result = DB.bookings.update(booking_id, { booking_status: "CANCELLED" });
  if (!result.success) return result;
  DB.cancellations.create({
    booking_id,
    cancel_date: new Date().toISOString().split("T")[0]
  });
  return { success: true, message: `Booking ${booking_id} cancelled.` };
};


/* ── Reset — wipe localStorage & re-seed from mock_data.js ─── */

/**
 * Completely resets the database back to the original mock data.
 * Clears all localStorage keys for this app, then re-seeds.
 */
DB.resetAll = function() {
  const tables = [
    "customers","admins","serviceProviders","customerSupport",
    "vehicles","seats","routes","schedules","trips","offers",
    "irctcRecords","bookings","payments","cancellations",
    "refunds","reviews","supportRequests","reports"
  ];
  tables.forEach(key => localStorage.removeItem(STORAGE_PREFIX + key));

  // Re-seed from mock_data.js globals
  storageSave("customers",        customers);
  storageSave("admins",           admins);
  storageSave("serviceProviders", serviceProviders);
  storageSave("customerSupport",  customerSupport);
  storageSave("vehicles",         vehicles);
  storageSave("seats",            seats);
  storageSave("routes",           routes);
  storageSave("schedules",        schedules);
  storageSave("trips",            trips);
  storageSave("offers",           offers);
  storageSave("irctcRecords",     irctcRecords);
  storageSave("bookings",         bookings);
  storageSave("payments",         payments);
  storageSave("cancellations",    cancellations);
  storageSave("refunds",          refunds);
  storageSave("reviews",          reviews);
  storageSave("supportRequests",  supportRequests);
  storageSave("reports",          reports);

  console.info("[DB] Database reset to mock data.");
  return { success: true, message: "Database reset to original mock data." };
};

// Expose globally for ui.js and browser console
window.DB = DB;
