import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  cancelledSchedules: [],
  cancelledTripIds: [],
  tripStatuses: {},
  tripCompletions: {},
  loading: false,
  error: null,
};

const schedulesSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    // CREATE
    createSchedule: (state, action) => {
      const s = action.payload;
      if (!s) return;
      const id = s.id || s.tripId;
      const idx = state.items.findIndex((x) => (x.id || x.tripId) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...s };
      else state.items.unshift(s);
    },
    // READ
    readSchedules: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateSchedule: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.id || updated.tripId;
      const idx = state.items.findIndex((x) => (x.id || x.tripId) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteSchedule: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((x) => (x.id || x.tripId) !== id);
    },
    setTripStatus: (state, action) => {
      const { tripId, status } = action.payload || {};
      if (tripId && status) state.tripStatuses[tripId] = status;
    },
    setTripStatuses: (state, action) => {
      if (action.payload && typeof action.payload === 'object') {
        state.tripStatuses = { ...state.tripStatuses, ...action.payload };
      }
    },
  },
});

export const {
  createSchedule,
  readSchedules,
  updateSchedule,
  deleteSchedule,
  setTripStatus,
  setTripStatuses,
} = schedulesSlice.actions;

export default schedulesSlice.reducer;
