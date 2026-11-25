import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_NOTIFICATIONS } from '../../services/mockData';

const initialState = {
  items: INITIAL_NOTIFICATIONS,
  notifiedTripIds: [],
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // CREATE
    createNotification: (state, action) => {
      const n = action.payload;
      if (!n) return;
      if (n.tripStartKey && state.items.some((x) => typeof x.id === 'string' && x.id.startsWith(n.tripStartKey))) {
        return;
      }
      state.items.unshift(n);
    },
    // READ / set
    readNotifications: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateNotification: (state, action) => {
      const updated = action.payload;
      if (!updated?.id) return;
      const idx = state.items.findIndex((n) => n.id === updated.id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteNotification: (state, action) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    markAllNotificationsRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, unread: false, read: true }));
    },
    markTripNotified: (state, action) => {
      if (action.payload && !state.notifiedTripIds.includes(action.payload)) {
        state.notifiedTripIds.push(action.payload);
      }
    },
  },
});

export const {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
  markTripNotified,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
