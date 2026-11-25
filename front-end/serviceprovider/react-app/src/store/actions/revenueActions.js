import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchRevenue } from '../../services/api';
import {
  createTransaction,
  readRevenue,
  updateRevenueStats,
  deleteTransaction,
} from '../slices/revenueSlice';

export { createTransaction, readRevenue, updateRevenueStats, deleteTransaction };

export const fetchRevenueThunk = createAsyncThunk(
  'revenue/fetchRevenue',
  async (providerId) => fetchRevenue(providerId)
);
