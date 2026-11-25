import { createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../../services/api';
import {
  createBooking,
  readBookings,
  updateBooking,
  deleteBooking,
  setPendingBookingRecord,
  setPassengers,
  setSelectedBookingForCancel,
  setLastBookingSummary,
  clearBookingTransient,
} from '../slices/bookingsSlice';

export {
  createBooking,
  readBookings,
  updateBooking,
  deleteBooking,
  setPendingBookingRecord,
  setPassengers,
  setSelectedBookingForCancel,
  setLastBookingSummary,
  clearBookingTransient,
};

export const fetchMyBookingsThunk = createAsyncThunk(
  'bookings/fetchMyBookings',
  async (_, { getState }) => {
    const existing = getState().bookings.items || [];
    let apiData = [];
    try {
      const res = await API.bookings.getMine();
      if (Array.isArray(res)) apiData = res;
    } catch {
      // Offline fallback to Redux memory state
    }

    const map = new Map();
    existing.forEach((b) => {
      const id = b.bookingId || b.booking_id || b.id;
      if (id) map.set(id, b);
    });
    apiData.forEach((b) => {
      const id = b.bookingId || b.booking_id;
      if (id && !map.has(id)) {
        map.set(id, b);
      }
    });
    return Array.from(map.values());
  }
);

export const createBookingThunk = createAsyncThunk(
  'bookings/createBooking',
  async (bookingRecord, { dispatch }) => {
    dispatch(createBooking(bookingRecord));
    return bookingRecord;
  }
);

export const updateBookingThunk = createAsyncThunk(
  'bookings/updateBooking',
  async (bookingRecord, { dispatch }) => {
    dispatch(updateBooking(bookingRecord));
    return bookingRecord;
  }
);

export const deleteBookingThunk = createAsyncThunk(
  'bookings/deleteBooking',
  async (bookingId, { dispatch }) => {
    dispatch(deleteBooking(bookingId));
    return bookingId;
  }
);
