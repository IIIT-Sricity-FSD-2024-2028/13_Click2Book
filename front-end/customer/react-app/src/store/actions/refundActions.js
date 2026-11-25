import { createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../../services/api';
import {
  createRefund,
  readRefunds,
  updateRefund,
  deleteRefund,
  setSelectedBookingForRefund,
  clearRefundSelection,
} from '../slices/refundsSlice';

export {
  createRefund,
  readRefunds,
  updateRefund,
  deleteRefund,
  setSelectedBookingForRefund,
  clearRefundSelection,
};

export const fetchRefundsThunk = createAsyncThunk(
  'refunds/fetchRefunds',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const customerId = state.auth.user?.id || 'C001';
      const raw = [...(state.refunds.items || [])];

      try {
        const apiBookings = await API.bookings.getMine();
        if (Array.isArray(apiBookings)) {
          for (const b of apiBookings) {
            if (b.bookingStatus === 'CANCELLED') {
              const bId = b.bookingId;
              let backendRefund = null;
              try {
                backendRefund = await API.refunds.getByBooking(bId);
              } catch {
                try {
                  const fare = Number(b.totalAmount || b.fare || 650);
                  backendRefund = await API.refunds.request(bId, Math.max(0, fare - 50));
                } catch {}
              }
              const fare = Number(b.totalAmount || b.fare || 650);
              const fee = 50;
              const refundAmt =
                backendRefund?.refundAmount !== undefined
                  ? Number(backendRefund.refundAmount)
                  : Math.max(0, fare - fee);
              const bStatus = backendRefund?.refundStatus
                ? backendRefund.refundStatus.toUpperCase()
                : 'REQUESTED';
              raw.unshift({
                refund_id: `REF-${bId}`,
                booking_id: bId,
                customer_id: customerId,
                route: `${b.from || 'Hyderabad'} → ${b.to || 'Chennai'}`,
                bus_name: b.busName || 'Click2Book Express',
                original_fare: fare,
                fee,
                refund_amount: refundAmt,
                status: bStatus === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
                raw_status: bStatus,
                request_date:
                  backendRefund?.refundDate ||
                  b.bookingDate ||
                  new Date().toISOString().split('T')[0],
                arn: `ARN${bId.replace(/\D/g, '') || '7829104'}55`,
                payment_method: 'UPI / Bank Source',
              });
            }
          }
        }
      } catch {}

      (state.bookings.items || []).forEach((b) => {
        const isCancelled = b.status === 'CANCELLED' || b.booking_status === 'CANCELLED';
        if (
          isCancelled &&
          (!b.customer_id || b.customer_id === customerId || b.customerId === customerId)
        ) {
          const bId = b.bookingId || b.booking_id;
          const fare = Number(b.total || b.amount || 650);
          raw.push({
            refund_id: `REF-${bId}`,
            booking_id: bId,
            customer_id: customerId,
            route: `${b.from || 'Hyderabad'} → ${b.to || 'Chennai'}`,
            bus_name: b.busName || 'Click2Book Express',
            original_fare: fare,
            fee: 50,
            refund_amount: Math.max(0, fare - 50),
            status: 'PROCESSING',
            raw_status: 'REQUESTED',
            request_date: b.cancelled_at
              ? b.cancelled_at.split('T')[0]
              : new Date().toISOString().split('T')[0],
            arn: `ARN${(bId || '').replace(/\D/g, '') || '7829104'}55`,
            payment_method: 'UPI / Source Account',
          });
        }
      });

      const seen = new Set();
      const unified = [];
      raw.forEach((r) => {
        const bId = r.booking_id || r.bookingId;
        if (!bId || seen.has(bId)) return;
        seen.add(bId);
        const status = (r.status || r.raw_status || 'PROCESSING').toUpperCase();
        unified.push({
          refundId: r.refundId || r.refund_id || `REF-${bId}`,
          refund_id: r.refund_id || r.refundId || `REF-${bId}`,
          bookingId: bId,
          booking_id: bId,
          route: r.route || 'Hyderabad → Chennai',
          busName: r.busName || r.bus_name || 'Click2Book Express',
          originalFare: Number(r.originalFare ?? r.original_fare ?? 650),
          fee: Number(r.fee || 50),
          refundAmount: Number(
            r.refundAmount !== undefined
              ? r.refundAmount
              : r.refund_amount !== undefined
                ? r.refund_amount
                : Math.max(0, (r.original_fare || 650) - 50)
          ),
          status: status === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
          rawStatus: status,
          date: r.date || r.request_date || new Date().toISOString().split('T')[0],
          arn: r.arn || `ARN${Date.now().toString().slice(-9)}`,
          paymentMethod: r.paymentMethod || r.payment_method || 'UPI (Source Account)',
        });
      });

      return unified;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load refunds');
    }
  }
);

export const createRefundThunk = createAsyncThunk(
  'refunds/createRefund',
  async (refundData, { dispatch }) => {
    dispatch(createRefund(refundData));
    return refundData;
  }
);

export const updateRefundThunk = createAsyncThunk(
  'refunds/updateRefund',
  async (refundData, { dispatch }) => {
    dispatch(updateRefund(refundData));
    return refundData;
  }
);

export const deleteRefundThunk = createAsyncThunk(
  'refunds/deleteRefund',
  async (refundId, { dispatch }) => {
    dispatch(deleteRefund(refundId));
    return refundId;
  }
);
