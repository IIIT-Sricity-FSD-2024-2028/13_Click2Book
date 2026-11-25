import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: {
    totalGross: 0,
    totalDiscount: 0,
    totalAfterCoupon: 0,
    totalNet: 0,
    totalBookings: 0,
    totalSeats: 0,
  },
  rows: [],
  transactions: [],
  isLive: false,
  loading: false,
  error: null,
};

const revenueSlice = createSlice({
  name: 'revenue',
  initialState,
  reducers: {
    // CREATE
    createTransaction: (state, action) => {
      if (action.payload) state.transactions.unshift(action.payload);
    },
    // READ
    readRevenue: (state, action) => {
      if (action.payload?.stats) state.stats = action.payload.stats;
      if (Array.isArray(action.payload?.rows)) state.rows = action.payload.rows;
      if (Array.isArray(action.payload?.transactions)) state.transactions = action.payload.transactions;
      if (typeof action.payload?.isLive === 'boolean') state.isLive = action.payload.isLive;
    },
    // UPDATE
    updateRevenueStats: (state, action) => {
      if (action.payload) state.stats = { ...state.stats, ...action.payload };
    },
    // DELETE
    deleteTransaction: (state, action) => {
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
    },
  },
});

export const { createTransaction, readRevenue, updateRevenueStats, deleteTransaction } = revenueSlice.actions;
export default revenueSlice.reducer;
