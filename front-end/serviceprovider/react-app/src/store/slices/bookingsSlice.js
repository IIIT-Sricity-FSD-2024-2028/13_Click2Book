import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    // CREATE
    createBooking: (state, action) => {
      const b = action.payload;
      if (!b) return;
      const id = b.bookingId || b.booking_id || b.id;
      const idx = state.items.findIndex((x) => (x.bookingId || x.booking_id || x.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...b };
      else state.items.unshift(b);
    },
    // READ
    readBookings: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateBooking: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.bookingId || updated.booking_id || updated.id;
      const idx = state.items.findIndex((x) => (x.bookingId || x.booking_id || x.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteBooking: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((x) => (x.bookingId || x.booking_id || x.id) !== id);
    },
  },
});

export const { createBooking, readBookings, updateBooking, deleteBooking } = bookingsSlice.actions;
export default bookingsSlice.reducer;
