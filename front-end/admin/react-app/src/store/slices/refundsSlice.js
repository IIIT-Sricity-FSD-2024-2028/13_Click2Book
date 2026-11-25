import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const refundsSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    // CREATE
    createRefund: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readRefunds: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateRefund: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const idx = state.items.findIndex(
        (r) => r.id === updated.id || r.bookingId === updated.bookingId
      );
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteRefund: (state, action) => {
      state.items = state.items.filter(
        (r) => r.id !== action.payload && r.bookingId !== action.payload
      );
    },
  },
});

export const { createRefund, readRefunds, updateRefund, deleteRefund } = refundsSlice.actions;
export default refundsSlice.reducer;
