import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, loadAdminDashboardData, loadAdminRevenueData } from '../../lib/api.js';
import { readBookings, setBookingSearch, clearBookingSearch } from '../slices/bookingsSlice';
import { readRefunds } from '../slices/refundsSlice';
import { readUsers } from '../slices/usersSlice';
import { readRoutes } from '../slices/routesSlice';
import { readReports, updateReportMetrics } from '../slices/reportsSlice';
import { setBusy, setRefreshing, setDataError } from '../slices/uiSlice';
import { showToastThunk } from './uiActions';

export { setBookingSearch, clearBookingSearch };

let _inflightDashboard = null;

export const loadAdminDashboardThunk = createAsyncThunk(
  'admin/loadDashboard',
  async (_, { dispatch, rejectWithValue }) => {
    if (_inflightDashboard) return _inflightDashboard;
    dispatch(setRefreshing(true));
    _inflightDashboard = loadAdminDashboardData()
      .then((data) => {
        dispatch(readBookings(data.bookings || []));
        dispatch(readRefunds(data.refunds || []));
        dispatch(readUsers(data.users || []));
        dispatch(readRoutes(data.routes || []));
        dispatch(readReports(data));
        dispatch(setDataError(''));
        return data;
      })
      .catch((err) => {
        dispatch(setDataError(`Live admin data unavailable: ${err.message}`));
        return rejectWithValue(err.message);
      })
      .finally(() => {
        dispatch(setRefreshing(false));
        _inflightDashboard = null;
      });
    return _inflightDashboard;
  }
);

export const loadAdminRevenueThunk = createAsyncThunk(
  'admin/loadRevenue',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setRefreshing(true));
    try {
      const data = await loadAdminRevenueData();
      dispatch(
        updateReportMetrics({
          bookings: data.bookings || [],
          refunds: data.refunds || [],
          totalRevenue: data.totalRevenue,
          grossRevenue: data.grossRevenue,
          totalRefunds: data.totalRefunds,
        })
      );
      dispatch(setDataError(''));
      return data;
    } catch (err) {
      dispatch(setDataError(`Live revenue unavailable: ${err.message}`));
      return rejectWithValue(err.message);
    } finally {
      dispatch(setRefreshing(false));
    }
  }
);

export const runAdminActionThunk = (actionFn, successMessage, fallbackError) => async (dispatch) => {
  dispatch(setBusy(true));
  try {
    await actionFn();
    await dispatch(loadAdminDashboardThunk());
    dispatch(showToastThunk(successMessage));
    return true;
  } catch (error) {
    dispatch(showToastThunk(error.message || fallbackError));
    return false;
  } finally {
    dispatch(setBusy(false));
  }
};

export const updateBookingStatusThunk = ({ id, status }) => (dispatch) =>
  dispatch(
    runAdminActionThunk(
      async () => {
        if (status === 'confirmed') {
          await apiFetch(`/bookings/${id}/confirm`, { method: 'PATCH' });
        } else if (status === 'cancelled') {
          await apiFetch('/cancellations', { method: 'POST', body: JSON.stringify({ bookingId: id }) });
        } else {
          throw new Error(`Unsupported booking update: ${status}`);
        }
      },
      `Booking ${id} updated.`,
      'Failed to update booking.'
    )
  );

export const toggleUserStatusThunk = (user) => (dispatch) => {
  if (user.status === 'active') {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${user.name || user.id}? The user will be unable to log in.`
    );
    if (!confirmed) return Promise.resolve(false);
  }
  const status = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
  const path =
    user.role === 'service_provider'
      ? `/providers/${user.id}/status`
      : user.role === 'support'
        ? `/support-staff/${user.id}/status`
        : `/customers/${user.id}/status`;
  return dispatch(
    runAdminActionThunk(
      () =>
        apiFetch(path, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      `User ${user.id} status updated to ${status.toLowerCase()}.`,
      'Failed to update user status.'
    )
  );
};

export const decideRefundThunk = ({ refund, status }) => (dispatch, getState) => {
  const adminId = getState().auth.adminId || 'A001';
  const refundStatus =
    status === 'approved' ? 'PROCESSING' : status === 'refunded' ? 'COMPLETED' : 'REJECTED';
  return dispatch(
    runAdminActionThunk(
      () =>
        apiFetch(`/refunds/booking/${refund.bookingId}/process`, {
          method: 'PATCH',
          body: JSON.stringify({ adminId, refundStatus }),
        }),
      `Refund ${refund.id} ${status}.`,
      'Failed to process refund.'
    )
  );
};
