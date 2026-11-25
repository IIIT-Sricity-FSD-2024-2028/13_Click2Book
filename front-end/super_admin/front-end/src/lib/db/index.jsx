/**
 * ============================================================
 *  CLICK2BOOK — CRUD Engine backed by Redux Memory Store
 *  Mirrors: online_ticket_booking SQL schema
 * ============================================================
 */
import {
  COMPOSITE_TABLES,
  createTableRecord,
  deleteTableRecord,
  replaceTableData,
  resetAllTables,
  updateTableRecord,
} from '../../store/slices/tablesSlice';

let _store = null;

export function injectDbStore(store) {
  _store = store;
}

export function replaceCachedTable(dbKey, rows) {
  if (_store) {
    _store.dispatch(replaceTableData({ dbKey, rows }));
  }
}

function getTable(key) {
  if (!_store) return [];
  return _store.getState().tables.tables[key] || [];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createCollection(tableKey, pkField) {
  return {
    getAll() {
      return getTable(tableKey);
    },

    getById(id) {
      const rows = getTable(tableKey);
      const item = rows.find((r) => r[pkField] === id || String(r[pkField]) === String(id));
      return item
        ? { success: true, data: item }
        : { success: false, error: `Record with ${pkField}="${id}" not found.` };
    },

    find(predicate) {
      return getTable(tableKey).filter(predicate);
    },

    create(record) {
      const next = { ...record };
      if (!next[pkField]) {
        next[pkField] = 'ID_' + Date.now();
      }
      const rows = getTable(tableKey);
      if (rows.some((r) => r[pkField] === next[pkField])) {
        return { success: false, error: `Duplicate ${pkField}="${next[pkField]}". Record already exists.` };
      }
      if (_store) {
        _store.dispatch(createTableRecord({ dbKey: tableKey, record: next }));
      }
      return { success: true, data: next, message: 'Record created successfully.' };
    },

    update(id, updates) {
      const rows = getTable(tableKey);
      const existing = rows.find((r) => r[pkField] === id || String(r[pkField]) === String(id));
      if (!existing) {
        return { success: false, error: `Record with ${pkField}="${id}" not found.` };
      }
      if (_store) {
        _store.dispatch(updateTableRecord({ dbKey: tableKey, pkValue: existing[pkField], updates }));
      }
      const updated = getTable(tableKey).find((r) => r[pkField] === existing[pkField]) || {
        ...existing,
        ...updates,
      };
      return { success: true, data: updated, message: 'Record updated successfully.' };
    },

    delete(id) {
      const rows = getTable(tableKey);
      const existing = rows.find((r) => r[pkField] === id || String(r[pkField]) === String(id));
      if (!existing) {
        return { success: false, error: `Record with ${pkField}="${id}" not found.` };
      }
      if (_store) {
        _store.dispatch(deleteTableRecord({ dbKey: tableKey, pkValue: existing[pkField] }));
      }
      return { success: true, data: existing, message: 'Record deleted successfully.' };
    },

    count() {
      return getTable(tableKey).length;
    },
  };
}

function createCompositeCollection(tableKey, keyFields) {
  const matches = (row, pkObj) => keyFields.every((k) => row[k] === pkObj[k]);
  return {
    getAll: () => getTable(tableKey),
    getById(pkObj) {
      const item = getTable(tableKey).find((r) => matches(r, pkObj || {}));
      return item ? { success: true, data: item } : { success: false, error: 'Record not found.' };
    },
    find: (fn) => getTable(tableKey).filter(fn),
    create(record) {
      if (getTable(tableKey).some((r) => matches(r, record))) {
        return { success: false, error: 'Duplicate composite key. Record already exists.' };
      }
      if (_store) {
        _store.dispatch(createTableRecord({ dbKey: tableKey, record }));
      }
      return { success: true, data: record, message: 'Record created successfully.' };
    },
    update(pkObj, updates) {
      const existing = getTable(tableKey).find((r) => matches(r, pkObj || {}));
      if (!existing) return { success: false, error: 'Record not found.' };
      if (_store) {
        _store.dispatch(updateTableRecord({ dbKey: tableKey, pkValue: pkObj, updates }));
      }
      return { success: true, data: { ...existing, ...updates }, message: 'Record updated successfully.' };
    },
    delete(pkObj) {
      const existing = getTable(tableKey).find((r) => matches(r, pkObj || {}));
      if (!existing) return { success: false, error: 'Record not found.' };
      if (_store) {
        _store.dispatch(deleteTableRecord({ dbKey: tableKey, pkValue: pkObj }));
      }
      return { success: true, data: existing, message: 'Record deleted successfully.' };
    },
    count: () => getTable(tableKey).length,
  };
}

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

export const DB = {
  ...Object.fromEntries(TABLES.map(([key, pk]) => [key, createCollection(key, pk)])),
  seats: createCompositeCollection('seats', COMPOSITE_TABLES.seats),
  reports: createCompositeCollection('reports', COMPOSITE_TABLES.reports),
};

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

DB.getCustomerBookings = function (customer_id) {
  return DB.bookings.find((b) => b.customer_id === customer_id);
};

DB.getTripsWithDetails = function () {
  return DB.trips.getAll().map((trip) => {
    const schedule = DB.schedules.find((sc) => sc.schedule_id === trip.schedule_id)[0] || null;
    const route = schedule ? DB.routes.find((r) => r.route_id === schedule.route_id)[0] : null;
    const vehicle = DB.vehicles.find((v) => v.vehicle_id === trip.vehicle_id)[0] || null;
    return { ...trip, schedule, route, vehicle };
  });
};

DB.getAvailableSeats = function (vehicle_id) {
  return DB.seats.find((s) => s.vehicle_id === vehicle_id && s.seat_status === 'AVAILABLE');
};

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
    DB.bookings.delete(bookingData.booking_id);
    return { success: false, error: `Payment failed: ${paymentResult.error}` };
  }

  return {
    success: true,
    message: 'Booking and payment created successfully.',
    data: { booking: bookingResult.data, payment: paymentResult.data },
  };
};

DB.cancelBooking = function (booking_id) {
  const result = DB.bookings.update(booking_id, { booking_status: 'CANCELLED' });
  if (!result.success) return result;
  DB.cancellations.create({ booking_id, cancel_date: today() });
  return { success: true, message: `Booking ${booking_id} cancelled.` };
};

DB.resetAll = function () {
  if (_store) {
    _store.dispatch(resetAllTables());
  }
  return { success: true, message: 'Database reset to original mock data.' };
};

export default DB;
