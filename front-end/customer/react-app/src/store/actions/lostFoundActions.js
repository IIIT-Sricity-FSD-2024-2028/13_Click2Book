import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import {
  createLostFoundItem,
  readLostFoundItems,
  updateLostFoundItem,
  deleteLostFoundItem,
} from '../slices/lostFoundSlice';

export {
  createLostFoundItem,
  readLostFoundItems,
  updateLostFoundItem,
  deleteLostFoundItem,
};

export const fetchLostFoundThunk = createAsyncThunk(
  'lostFound/fetchLostFound',
  async (_, { getState }) => {
    let list = [...(getState().lostFound.items || [])];
    try {
      const mine = await api.lostFound.getMine();
      if (Array.isArray(mine)) {
        const seen = new Set(list.map((r) => r.id || r.reportId));
        mine.forEach((r) => {
          if (!seen.has(r.id || r.reportId)) list.unshift(r);
        });
      }
    } catch {}

    if (list.length === 0) {
      list = [
        {
          id: 'LF-101',
          bookingId: 'BK1002',
          tripId: 'TRIP-102',
          itemDescription: 'Black laptop sleeve left under Seat 15',
          category: 'Electronics',
          dateLost: '2026-03-24',
          status: 'FOUND',
          foundNote: 'Item stored at Pune Station operator office for verification.',
        },
      ];
    }
    return list;
  }
);

export const reportLostFoundThunk = createAsyncThunk(
  'lostFound/reportLostFound',
  async (reportData) => {
    try {
      await api.lostFound.report(
        reportData.tripId,
        reportData.bookingId,
        reportData.itemDescription,
        reportData.category,
        reportData.dateLost,
        reportData.contactPhone
      );
    } catch {}
    return reportData;
  }
);

export const updateLostFoundThunk = createAsyncThunk(
  'lostFound/updateLostFound',
  async (data, { dispatch }) => {
    dispatch(updateLostFoundItem(data));
    return data;
  }
);

export const deleteLostFoundThunk = createAsyncThunk(
  'lostFound/deleteLostFound',
  async (id, { dispatch }) => {
    dispatch(deleteLostFoundItem(id));
    return id;
  }
);
