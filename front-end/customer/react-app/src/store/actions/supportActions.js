import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import {
  createSupportRequest,
  readSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
} from '../slices/supportRequestsSlice';

export {
  createSupportRequest,
  readSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
};

export const fetchSupportRequestsThunk = createAsyncThunk(
  'supportRequests/fetchSupportRequests',
  async (customerId, { getState }) => {
    const map = new Map();
    const existing = getState().supportRequests.items || [];
    existing.forEach((item) => {
      const id = item.requestId || item.request_id || item.id;
      if (id) map.set(id, item);
    });

    try {
      const live = await api.supportRequests.getMine(customerId);
      if (Array.isArray(live) && live.length > 0) {
        live.forEach((item) => {
          const id = item.requestId || item.request_id || item.id;
          if (id) map.set(id, { ...(map.get(id) || {}), ...item });
        });
      }
    } catch {}

    if (map.size === 0) {
      map.set('REQ-DEMO101', {
        requestId: 'REQ-DEMO101',
        category: 'Booking Issue',
        bookingId: 'BK1002',
        description: 'Seat assignment preference was modified unexpectedly during boarding.',
        status: 'RESOLVED',
        createdAt: '2026-03-28',
        resolution: 'Support Agent checked with the operator and restored your seat.',
        response: 'Support Agent checked with the operator and restored your seat.',
      });
    }

    return Array.from(map.values());
  }
);

export const submitSupportRequestThunk = createAsyncThunk(
  'supportRequests/submitSupportRequest',
  async (newTicket) => {
    let ticket = { ...newTicket };
    try {
      const liveRes = await api.supportRequests.create(newTicket);
      if (liveRes && (liveRes.requestId || liveRes.id)) {
        const ticketId = liveRes.requestId || liveRes.id;
        ticket = { ...ticket, ...liveRes, requestId: ticketId };
      }
    } catch {}

    try {
      if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
        const ch = new BroadcastChannel('click2book_support_sync');
        ch.postMessage({ type: 'NEW_CUSTOMER_TICKET', ticket });
        setTimeout(() => {
          try {
            ch.close();
          } catch {}
        }, 200);
      }
    } catch {}

    return ticket;
  }
);

export const updateSupportRequestThunk = createAsyncThunk(
  'supportRequests/updateSupportRequest',
  async (data, { dispatch }) => {
    dispatch(updateSupportRequest(data));
    return data;
  }
);

export const deleteSupportRequestThunk = createAsyncThunk(
  'supportRequests/deleteSupportRequest',
  async (id, { dispatch }) => {
    dispatch(deleteSupportRequest(id));
    return id;
  }
);
