import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_REFUNDS } from '../../services/mockData';

const initialState = {
  items: INITIAL_REFUNDS,
  loading: false,
  error: null,
};

function refundsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].refundId !== b[i].refundId || a[i].status !== b[i].status) {
      return false;
    }
  }
  return true;
}

const refundsSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    // CREATE
    createRefund: (state, action) => {
      const refund = action.payload;
      if (refund && !state.items.some((r) => r.refundId === refund.refundId)) {
        state.items.unshift(refund);
      }
    },
    // READ / set
    readRefunds: (state, action) => {
      if (Array.isArray(action.payload) && !refundsEqual(state.items, action.payload)) {
        state.items = action.payload;
      }
    },
    // UPDATE
    updateRefund: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const idx = state.items.findIndex(
        (r) =>
          (updated.refundId && r.refundId === updated.refundId) ||
          (updated.bookingId && r.bookingId === updated.bookingId)
      );
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...updated };
      }
    },
    // DELETE
    deleteRefund: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((r) => r.refundId !== id && r.bookingId !== id);
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
          if (Array.isArray(action.payload) && !refundsEqual(state.items, action.payload)) {
            state.items = action.payload;
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/fetchRefunds/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Failed to load refunds';
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/updateRefundStatus/fulfilled',
        (state, action) => {
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/createRefund/fulfilled',
        (state, action) => {
          if (action.payload) state.items.unshift(action.payload);
        }
      )
      .addMatcher(
        (action) => action.type === 'refunds/deleteRefund/fulfilled',
        (state, action) => {
          state.items = state.items.filter((r) => r.refundId !== action.payload);
        }
      );
  },
});

export const { createRefund, readRefunds, updateRefund, deleteRefund } = refundsSlice.actions;

export default refundsSlice.reducer;
