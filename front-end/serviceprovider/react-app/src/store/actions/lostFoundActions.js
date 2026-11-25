import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchLostFound, updateLostFoundStatus } from '../../services/api';
import {
  createLostFound,
  readLostFound,
  updateLostFound,
  deleteLostFound,
} from '../slices/lostFoundSlice';

export { createLostFound, readLostFound, updateLostFound, deleteLostFound };

export const fetchLostFoundThunk = createAsyncThunk(
  'lostFound/fetchLostFound',
  async (providerId, { dispatch }) => {
    const res = await fetchLostFound(providerId);
    const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    dispatch(readLostFound(items));
    return items;
  }
);

export const updateLostFoundStatusThunk = createAsyncThunk(
  'lostFound/updateStatus',
  async ({ itemId, status, foundNote }, { dispatch }) => {
    const res = await updateLostFoundStatus(itemId, status, foundNote);
    dispatch(updateLostFound({ id: itemId, itemId, status, foundNote }));
    return res;
  }
);
