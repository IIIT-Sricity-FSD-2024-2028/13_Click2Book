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
    createLostFound: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readLostFound: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateLostFound: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.id || updated.itemId;
      const idx = state.items.findIndex((i) => (i.id || i.itemId) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteLostFound: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => (i.id || i.itemId) !== id);
    },
  },
});

export const { createLostFound, readLostFound, updateLostFound, deleteLostFound } = lostFoundSlice.actions;
export default lostFoundSlice.reducer;
