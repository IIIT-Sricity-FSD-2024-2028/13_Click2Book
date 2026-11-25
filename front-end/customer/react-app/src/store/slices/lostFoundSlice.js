import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const lostFoundSlice = createSlice({
  name: 'lostFound',
  initialState,
  reducers: {
    // CREATE
    createLostFoundItem: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ / set
    readLostFoundItems: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateLostFoundItem: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.id || updated.reportId;
      const idx = state.items.findIndex((r) => (r.id || r.reportId) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteLostFoundItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((r) => (r.id || r.reportId) !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'lostFound/fetchLostFound/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type === 'lostFound/reportLostFound/fulfilled',
        (state, action) => {
          if (action.payload) state.items.unshift(action.payload);
        }
      );
  },
});

export const {
  createLostFoundItem,
  readLostFoundItems,
  updateLostFoundItem,
  deleteLostFoundItem,
} = lostFoundSlice.actions;

export default lostFoundSlice.reducer;
