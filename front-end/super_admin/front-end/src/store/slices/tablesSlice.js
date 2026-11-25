import { createSlice } from '@reduxjs/toolkit';
import * as MockData from '../../lib/db/mockData';

export const COMPOSITE_TABLES = {
  seats: ['vehicle_id', 'seat_number'],
  reports: ['admin_id', 'report_date'],
};

export const TABLE_PK_MAP = {
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

const clone = (val) => JSON.parse(JSON.stringify(val));

function buildInitialTables() {
  return {
    customers: clone(MockData.customers || []),
    admins: clone(MockData.admins || []),
    serviceProviders: clone(MockData.serviceProviders || []),
    customerSupport: clone(MockData.customerSupport || []),
    vehicles: clone(MockData.vehicles || []),
    routes: clone(MockData.routes || []),
    schedules: clone(MockData.schedules || []),
    trips: clone(MockData.trips || []),
    seats: clone(MockData.seats || []),
    offers: clone(MockData.offers || []),
    irctcRecords: clone(MockData.irctcRecords || []),
    bookings: clone(MockData.bookings || []),
    payments: clone(MockData.payments || []),
    cancellations: clone(MockData.cancellations || []),
    refunds: clone(MockData.refunds || []),
    reviews: clone(MockData.reviews || []),
    supportRequests: clone(MockData.supportRequests || []),
    reports: clone(MockData.reports || []),
  };
}

function matchesComposite(row, fields, pkObj) {
  return fields.every((k) => row[k] === pkObj[k]);
}

const initialState = {
  tables: buildInitialTables(),
  sync: {
    state: 'loading',
    at: null,
    failed: [],
    version: 0,
  },
  saving: false,
  error: '',
};

const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    // CREATE
    createTableRecord: (state, action) => {
      const { dbKey, record } = action.payload;
      const rows = state.tables[dbKey] || [];
      if (COMPOSITE_TABLES[dbKey]) {
        const fields = COMPOSITE_TABLES[dbKey];
        const exists = rows.some((r) => matchesComposite(r, fields, record));
        if (!exists) {
          rows.push(clone(record));
          state.tables[dbKey] = rows;
          state.sync.version += 1;
        }
        return;
      }
      const pkField = TABLE_PK_MAP[dbKey];
      const next = clone(record);
      if (pkField && !next[pkField]) {
        next[pkField] = 'ID_' + Date.now();
      }
      if (!pkField || !rows.some((r) => r[pkField] === next[pkField])) {
        rows.push(next);
        state.tables[dbKey] = rows;
        state.sync.version += 1;
      }
    },

    // READ
    readTables: (state) => state,

    // UPDATE
    updateTableRecord: (state, action) => {
      const { dbKey, pkValue, updates } = action.payload;
      const rows = state.tables[dbKey] || [];
      if (COMPOSITE_TABLES[dbKey]) {
        const fields = COMPOSITE_TABLES[dbKey];
        const idx = rows.findIndex((r) => matchesComposite(r, fields, pkValue || {}));
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...clone(updates) };
          state.sync.version += 1;
        }
        return;
      }
      const pkField = TABLE_PK_MAP[dbKey];
      const idx = rows.findIndex(
        (r) => r[pkField] === pkValue || String(r[pkField]) === String(pkValue),
      );
      if (idx !== -1) {
        rows[idx] = { ...rows[idx], ...clone(updates), [pkField]: rows[idx][pkField] };
        state.sync.version += 1;
      }
    },

    // DELETE
    deleteTableRecord: (state, action) => {
      const { dbKey, pkValue } = action.payload;
      const rows = state.tables[dbKey] || [];
      if (COMPOSITE_TABLES[dbKey]) {
        const fields = COMPOSITE_TABLES[dbKey];
        state.tables[dbKey] = rows.filter((r) => !matchesComposite(r, fields, pkValue || {}));
        state.sync.version += 1;
        return;
      }
      const pkField = TABLE_PK_MAP[dbKey];
      state.tables[dbKey] = rows.filter(
        (r) => r[pkField] !== pkValue && String(r[pkField]) !== String(pkValue),
      );
      state.sync.version += 1;
    },

    replaceTableData: (state, action) => {
      const { dbKey, rows } = action.payload;
      state.tables[dbKey] = clone(Array.isArray(rows) ? rows : []);
      state.sync.version += 1;
    },

    resetAllTables: (state) => {
      state.tables = buildInitialTables();
      state.sync.version += 1;
      state.error = '';
    },

    setSyncStatus: (state, action) => {
      const { state: syncState, at, failed } = action.payload || {};
      state.sync.state = syncState ?? state.sync.state;
      state.sync.at = at ?? Date.now();
      state.sync.failed = Array.isArray(failed) ? failed : [];
      state.sync.version += 1;
    },

    bumpTableVersion: (state) => {
      state.sync.version += 1;
    },

    setTablesSaving: (state, action) => {
      state.saving = Boolean(action.payload);
    },

    setTablesError: (state, action) => {
      state.error = action.payload || '';
    },
  },
});

export const {
  createTableRecord,
  readTables,
  updateTableRecord,
  deleteTableRecord,
  replaceTableData,
  resetAllTables,
  setSyncStatus,
  bumpTableVersion,
  setTablesSaving,
  setTablesError,
} = tablesSlice.actions;

export default tablesSlice.reducer;
