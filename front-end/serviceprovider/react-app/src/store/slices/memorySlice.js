import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  entries: {},
};

const memorySlice = createSlice({
  name: 'memory',
  initialState,
  reducers: {
    // CREATE
    createMemoryEntry: (state, action) => {
      const { key, value } = action.payload || {};
      if (key) state.entries[key] = value;
    },
    // READ
    readMemoryEntry: (state) => state,
    // UPDATE
    updateMemoryEntry: (state, action) => {
      const { key, value } = action.payload || {};
      if (key) state.entries[key] = value;
    },
    // DELETE
    deleteMemoryEntry: (state, action) => {
      if (action.payload) delete state.entries[action.payload];
    },
    clearMemoryEntries: (state) => {
      state.entries = {};
    },
  },
});

export const {
  createMemoryEntry,
  readMemoryEntry,
  updateMemoryEntry,
  deleteMemoryEntry,
  clearMemoryEntries,
} = memorySlice.actions;

export default memorySlice.reducer;
