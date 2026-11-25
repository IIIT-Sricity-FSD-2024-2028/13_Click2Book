import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  pendingBookingRecord: null,
  passengers: [],
  selectedBookingForCancel: null,
  lastBookingSummary: null,
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
      state.items = [
        b,
        ...state.items.filter((x) => (x.bookingId || x.booking_id || x.id) !== id),
      ];
    },
    // READ / set
    readBookings: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      }
    },
    // UPDATE
    updateBooking: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.bookingId || updated.booking_id || updated.id;
      const idx = state.items.findIndex(
        (x) => (x.bookingId || x.booking_id || x.id) === id
      );
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
      else state.items.unshift(updated);
    },
    // DELETE
    deleteBooking: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(
        (x) => (x.bookingId || x.booking_id || x.id) !== id
      );
    },
    setPendingBookingRecord: (state, action) => {
      state.pendingBookingRecord = action.payload || null;
    },
    setPassengers: (state, action) => {
      state.passengers = Array.isArray(action.payload) ? action.payload : [];
    },
    setSelectedBookingForCancel: (state, action) => {
      state.selectedBookingForCancel = action.payload || null;
    },
    setLastBookingSummary: (state, action) => {
      state.lastBookingSummary = action.payload || null;
    },
    clearBookingTransient: (state) => {
      state.selectedBookingForCancel = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'bookings/fetchMyBookings/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'bookings/fetchMyBookings/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'bookings/fetchMyBookings/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Failed to load bookings';
        }
      );
  },
});

export const {
  createBooking,
  readBookings,
  updateBooking,
  deleteBooking,
  setPendingBookingRecord,
  setPassengers,
  setSelectedBookingForCancel,
  setLastBookingSummary,
  clearBookingTransient,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
