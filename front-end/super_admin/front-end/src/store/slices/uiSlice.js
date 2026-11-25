import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activePath: '/',
  panelOpen: false,
  currentTable: '',
  searchFilter: '',
  modalRecord: null, // null | { record: object|null }
  pendingDelete: null, // null | { pkField, pkValue, dbKey }
  toast: { message: '', type: 'success', show: false },
  ledgerFilter: '',
  ticketFilter: '',
  paymentFilter: '',
  refundFilter: '',
  trendMode: 'daily',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // CREATE / SET transient UI item
    setPanelOpen: (state, action) => {
      state.panelOpen = Boolean(action.payload);
    },
    setCurrentTable: (state, action) => {
      state.currentTable = action.payload || '';
      state.searchFilter = '';
      state.modalRecord = null;
      state.pendingDelete = null;
    },
    // READ UI state
    readUiState: (state) => state,
    // UPDATE transient filters / modals / notifications
    setSearchFilter: (state, action) => {
      state.searchFilter = action.payload || '';
    },
    setPanelModal: (state, action) => {
      state.modalRecord = action.payload || null;
    },
    setPendingDelete: (state, action) => {
      state.pendingDelete = action.payload || null;
    },
    showPanelToast: (state, action) => {
      const { message, type = 'success' } = action.payload || {};
      state.toast = { message: message || '', type, show: true };
    },
    // DELETE / hide transient toast or clear navigation-scoped transient UI
    hidePanelToast: (state) => {
      state.toast = { ...state.toast, show: false };
    },
    setLedgerFilter: (state, action) => {
      state.ledgerFilter = action.payload || '';
    },
    setTicketFilter: (state, action) => {
      state.ticketFilter = action.payload || '';
    },
    setPaymentFilter: (state, action) => {
      state.paymentFilter = action.payload || '';
    },
    setRefundFilter: (state, action) => {
      state.refundFilter = action.payload || '';
    },
    setTrendMode: (state, action) => {
      state.trendMode = action.payload || 'daily';
    },
    setActiveRoute: (state, action) => {
      const nextPath = action.payload || '/';
      if (state.activePath !== nextPath) {
        state.activePath = nextPath;
        state.modalRecord = null;
        state.pendingDelete = null;
        state.toast = { message: '', type: 'success', show: false };
        state.searchFilter = '';
        state.ledgerFilter = '';
        state.ticketFilter = '';
        state.paymentFilter = '';
        state.refundFilter = '';
      }
    },
  },
});

export const {
  setPanelOpen,
  setCurrentTable,
  readUiState,
  setSearchFilter,
  setPanelModal,
  setPendingDelete,
  showPanelToast,
  hidePanelToast,
  setLedgerFilter,
  setTicketFilter,
  setPaymentFilter,
  setRefundFilter,
  setTrendMode,
  setActiveRoute,
} = uiSlice.actions;

export default uiSlice.reducer;
