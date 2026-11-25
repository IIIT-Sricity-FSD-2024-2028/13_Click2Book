import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedBookingForRefund: '',
  loading: false,
  error: null,
};

const refundsSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    // CREATE
    createRefund: (state, action) => {
      const r = action.payload;
      if (!r) return;
      const bId = r.bookingId || r.booking_id;
      const idx = state.items.findIndex((x) => (x.bookingId || x.booking_id) === bId);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...r };
      else state.items.unshift(r);
    },
    // READ / set
    readRefunds: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateRefund: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const bId = updated.bookingId || updated.booking_id;
      const rId = updated.refundId || updated.refund_id;
      const idx = state.items.findIndex(
        (x) =>
          (bId && (x.bookingId || x.booking_id) === bId) ||
          (rId && (x.refundId || x.refund_id) === rId)
      );
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteRefund: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(
        (x) => x.refundId !== id && x.refund_id !== id && x.bookingId !== id && x.booking_id !== id
      );
    },
    setSelectedBookingForRefund: (state, action) => {
      state.selectedBookingForRefund = action.payload || '';
    },
    clearRefundSelection: (state) => {
      state.selectedBookingForRefund = '';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'refunds/fetchRefunds/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/fetchRefunds/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/fetchRefunds/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Failed to load refunds';
        }
      );
  },
});

export const {
  createRefund,
  readRefunds,
  updateRefund,
  deleteRefund,
  setSelectedBookingForRefund,
  clearRefundSelection,
} = refundsSlice.actions;

export default refundsSlice.reducer;
