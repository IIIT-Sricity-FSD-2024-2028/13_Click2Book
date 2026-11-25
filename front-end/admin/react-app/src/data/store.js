// In-memory Redux-backed CRUD store — ES-module port of
// /crud functions/js/script.js. Reads and writes directly to Redux `tables` slice.

import {
  createTableRecord,
  updateTableRecord,
  deleteTableRecord,
  resetAllTables,
} from '../store/slices/tablesSlice';

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

let _storeRef = null;
export function injectAdminDataStore(store) {
  _storeRef = store;
}

function load(key) {
  return _storeRef ? _storeRef.getState()?.tables?.data?.[key] || [] : [];
}

function createTable(key, pkField) {
  const rows = () => load(key);
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
      if (_storeRef) {
        _storeRef.dispatch(createTableRecord({ tableKey: key, record }));
      }
      return { success: true, data: { ...record }, message: `Record created in ${key}.` };
    },

    update(id, changes) {
      const data = rows();
      const index = data.findIndex((row) => row[pkField] === id);
      if (index === -1) return notFound(id);
      if (_storeRef) {
        _storeRef.dispatch(updateTableRecord({ tableKey: key, pkField, id, changes }));
      }
      const { [pkField]: _ignored, ...safeChanges } = changes;
      return { success: true, data: { ...data[index], ...safeChanges }, message: `Record updated in ${key}.` };
    },

    delete(id) {
      const data = rows();
      const index = data.findIndex((row) => row[pkField] === id);
      if (index === -1) return notFound(id);
      const deleted = data[index];
      if (_storeRef) {
        _storeRef.dispatch(deleteTableRecord({ tableKey: key, pkField, id }));
      }
      return { success: true, data: { ...deleted }, message: `Record deleted from ${key}.` };
    },
  };
}

export const DB = Object.fromEntries(
  Object.entries(PRIMARY_KEYS).map(([key, pkField]) => [key, createTable(key, pkField)]),
);

DB.resetAll = () => {
  if (_storeRef) {
    _storeRef.dispatch(resetAllTables());
  }
  return { success: true, message: 'Database reset to original mock data.' };
};
