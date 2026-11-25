import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // CREATE
    createNotification: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
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
      state.items = state.items.map((n) => ({ ...n, read: true }));
    },
  },
});

export const {
  createNotification,
  readNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
