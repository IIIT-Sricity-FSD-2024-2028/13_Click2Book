import { createAsyncThunk } from '@reduxjs/toolkit';
import { getRefunds, updateRefundStatus } from '../../services/api';
import { createRefund, readRefunds, updateRefund, deleteRefund } from '../slices/refundsSlice';
import { showToastThunk } from './uiActions';

export { createRefund, readRefunds, updateRefund, deleteRefund };

export const fetchRefundsThunk = createAsyncThunk(
  'refunds/fetchRefunds',
  async (forceRefresh = false, { rejectWithValue }) => {
    try {
      return await getRefunds(forceRefresh);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load refunds');
    }
  }
);

export const createRefundThunk = createAsyncThunk(
  'refunds/createRefund',
  async (refundData) => ({
    refundId: refundData.refundId || `REF-${Date.now().toString().slice(-5)}`,
    status: 'REQUESTED',
    date: new Date().toISOString().split('T')[0],
    ...refundData,
  })
);

export const updateRefundStatusThunk = createAsyncThunk(
  'refunds/updateRefundStatus',
  async ({ refundId, status }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await updateRefundStatus(refundId, status);
      dispatch(showToastThunk(`Refund ${refundId} marked as ${status}.`, 'success'));
      return updated;
    } catch (e) {
      dispatch(showToastThunk(`Failed to update refund: ${e.message}`, 'error'));
      return rejectWithValue(e.message);
    }
  }
);

export const deleteRefundThunk = createAsyncThunk(
  'refunds/deleteRefund',
  async (refundId) => refundId
);
