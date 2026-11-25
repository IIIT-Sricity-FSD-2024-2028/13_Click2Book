import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  search: '',
  loading: false,
  error: null,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // CREATE
    createBooking: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readBookings: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateBooking: (state, action) => {
      const updated = action.payload;
      if (!updated?.id) return;
      const idx = state.items.findIndex((b) => b.id === updated.id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteBooking: (state, action) => {
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
    setBookingSearch: (state, action) => {
      state.search = action.payload || '';
    },
    clearBookingSearch: (state) => {
      state.search = '';
    },
  },
});

export const {
  createBooking,
  readBookings,
  updateBooking,
  deleteBooking,
  setBookingSearch,
  clearBookingSearch,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
