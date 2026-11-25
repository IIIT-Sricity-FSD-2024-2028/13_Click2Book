import { createAsyncThunk } from '@reduxjs/toolkit';
import { getProviderBookings } from '../../services/api';
import {
  createBooking,
  readBookings,
  updateBooking,
  deleteBooking,
} from '../slices/bookingsSlice';

export { createBooking, readBookings, updateBooking, deleteBooking };

export const fetchBookingsThunk = createAsyncThunk(
  'bookings/fetchBookings',
  async (providerId, { dispatch }) => {
    const list = await getProviderBookings(providerId);
    dispatch(readBookings(list));
    return list;
  }
);
