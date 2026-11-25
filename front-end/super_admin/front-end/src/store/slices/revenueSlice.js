import { createSlice } from '@reduxjs/toolkit';

const EMPTY_CONFIG = { commissionPct: '', convenienceFee: '', gatewayFeePct: '' };

const initialState = {
  connected: null, // null = connecting
  demoMode: false,
  config: { ...EMPTY_CONFIG },
  warning: '',
  error: '',
  stats: null,
  ledger: null,
  tickets: null,
  payments: null,
  payouts: null,
  transfers: [],
  refunds: null,
  refundCustomers: {},
  transferring: '',
  refundBusy: '',
  refundError: '',
  loading: false,
};

const revenueSlice = createSlice({
  name: 'revenue',
  initialState,
  reducers: {
    // CREATE
    createRevenueEntry: (state, action) => {
      const { kind, record } = action.payload || {};
      if (kind === 'ledger' && Array.isArray(state.ledger)) state.ledger.unshift(record);
      if (kind === 'payment' && Array.isArray(state.payments)) state.payments.unshift(record);
      if (kind === 'transfer' && Array.isArray(state.transfers)) state.transfers.unshift(record);
      if (kind === 'refund' && Array.isArray(state.refunds)) state.refunds.unshift(record);
      if (kind === 'ticket' && Array.isArray(state.tickets)) state.tickets.unshift(record);
    },
    // READ
    readRevenueState: (state) => state,
    // UPDATE
    updateRevenueEntry: (state, action) => {
      const { kind, idField, idValue, updates } = action.payload || {};
      const list = state[kind];
      if (!Array.isArray(list)) return;
      const idx = list.findIndex((item) => item?.[idField] === idValue);
      if (idx !== -1) list[idx] = { ...list[idx], ...updates };
    },
    // DELETE
    deleteRevenueEntry: (state, action) => {
      const { kind, idField, idValue } = action.payload || {};
      const list = state[kind];
      if (!Array.isArray(list)) return;
      state[kind] = list.filter((item) => item?.[idField] !== idValue);
    },
    setRevenueConnected: (state, action) => {
      state.connected = action.payload;
    },
    setRevenueDemoMode: (state, action) => {
      state.demoMode = Boolean(action.payload);
    },
    setRevenueConfig: (state, action) => {
      state.config = { ...state.config, ...(action.payload || {}) };
    },
    setRevenueWarning: (state, action) => {
      state.warning = action.payload || '';
    },
    setRevenueError: (state, action) => {
      state.error = action.payload || '';
    },
    setRevenueStats: (state, action) => {
      state.stats = action.payload || null;
    },
    setRevenueLedger: (state, action) => {
      state.ledger = action.payload;
    },
    setRevenueTickets: (state, action) => {
      state.tickets = action.payload;
    },
    setRevenuePayments: (state, action) => {
      state.payments = action.payload;
    },
    setRevenuePayouts: (state, action) => {
      state.payouts = action.payload;
    },
    setRevenueTransfers: (state, action) => {
      state.transfers = Array.isArray(action.payload) ? action.payload : [];
    },
    setRevenueRefunds: (state, action) => {
      const { refunds, customerOf } = action.payload || {};
      state.refunds = refunds ?? state.refunds;
      if (customerOf) state.refundCustomers = customerOf;
    },
    setTransferringOperator: (state, action) => {
      state.transferring = action.payload || '';
    },
    setRefundBusy: (state, action) => {
      state.refundBusy = action.payload || '';
    },
    setRefundError: (state, action) => {
      state.refundError = action.payload || '';
    },
    setRevenueLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    clearRevenueTransient: (state) => {
      state.warning = '';
      state.error = '';
      state.refundError = '';
      state.transferring = '';
      state.refundBusy = '';
    },
  },
});

export const {
  createRevenueEntry,
  readRevenueState,
  updateRevenueEntry,
  deleteRevenueEntry,
  setRevenueConnected,
  setRevenueDemoMode,
  setRevenueConfig,
  setRevenueWarning,
  setRevenueError,
  setRevenueStats,
  setRevenueLedger,
  setRevenueTickets,
  setRevenuePayments,
  setRevenuePayouts,
  setRevenueTransfers,
  setRevenueRefunds,
  setTransferringOperator,
  setRefundBusy,
  setRefundError,
  setRevenueLoading,
  clearRevenueTransient,
} = revenueSlice.actions;

export default revenueSlice.reducer;
