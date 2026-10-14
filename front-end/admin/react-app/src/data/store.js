// localStorage-backed CRUD store — ES-module port of
// /crud functions/js/script.js. It reads and writes the same "c2b_<table>"
// keys, so edits made here show up in the other portals and vice versa.

import { SEED } from './mockData.js';

const STORAGE_PREFIX = 'c2b_';

const PRIMARY_KEYS = {
  customers: 'customer_id',
  admins: 'admin_id',
  serviceProviders: 'provider_id',
  customerSupport: 'supporter_id',
  vehicles: 'vehicle_id',
  routes: 'route_id',
  schedules: 'schedule_id',
  trips: 'trip_id',
  offers: 'offer_id',
  irctcRecords: 'irctc_id',
  bookings: 'booking_id',
  payments: 'payment_id',
  cancellations: 'booking_id',
  refunds: 'booking_id',
  reviews: 'review_id',
  supportRequests: 'request_id',
};

function load(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`[DB] Failed to load "${key}" from localStorage:`, error);
    return null;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (error) {
    console.warn(`[DB] Failed to save "${key}" to localStorage:`, error);
  }
}

function seedIfEmpty(key) {
  if (localStorage.getItem(STORAGE_PREFIX + key) === null) save(key, SEED[key]);
}

function createTable(key, pkField) {
  const rows = () => load(key) || [];
  const notFound = (id) => ({ success: false, error: `No "${key}" record with ${pkField} = "${id}"` });

  return {
    getAll: () => [...rows()],

    getById(id) {
      const record = rows().find((row) => row[pkField] === id);
      return record ? { success: true, data: { ...record } } : notFound(id);
    },

    find: (predicate) => rows().filter(predicate).map((row) => ({ ...row })),

    create(record) {
      if (!record[pkField]) return { success: false, error: `Primary key "${pkField}" is required.` };
      const data = rows();
      if (data.some((row) => row[pkField] === record[pkField])) {
        return { success: false, error: `"${record[pkField]}" already exists in ${key}.` };
      }
      data.push({ ...record });
      save(key, data);
      return { success: true, data: { ...record }, message: `Record created in ${key}.` };
    },

    update(id, changes) {
      const data = rows();
      const index = data.findIndex((row) => row[pkField] === id);
      if (index === -1) return notFound(id);
      const { [pkField]: _ignored, ...safeChanges } = changes;
      data[index] = { ...data[index], ...safeChanges };
      save(key, data);
      return { success: true, data: { ...data[index] }, message: `Record updated in ${key}.` };
    },

    delete(id) {
      const data = rows();
      const index = data.findIndex((row) => row[pkField] === id);
      if (index === -1) return notFound(id);
      const [deleted] = data.splice(index, 1);
      save(key, data);
      return { success: true, data: { ...deleted }, message: `Record deleted from ${key}.` };
    },
  };
}

Object.keys(SEED).forEach(seedIfEmpty);

export const DB = Object.fromEntries(
  Object.entries(PRIMARY_KEYS).map(([key, pkField]) => [key, createTable(key, pkField)]),
);

// Wipe every table and re-seed from the mock data.
DB.resetAll = () => {
  Object.keys(SEED).forEach((key) => save(key, SEED[key]));
  return { success: true, message: 'Database reset to original mock data.' };
};
