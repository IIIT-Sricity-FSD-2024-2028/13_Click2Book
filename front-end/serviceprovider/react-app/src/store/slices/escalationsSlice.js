import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const escalationsSlice = createSlice({
  name: 'escalations',
  initialState,
  reducers: {
    // CREATE
    createEscalation: (state, action) => {
      const esc = action.payload;
      if (!esc) return;
      const idx = state.items.findIndex((e) => e.id === esc.id || e.ticketId === esc.ticketId);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...esc };
      else state.items.unshift(esc);
    },
    // READ
    readEscalations: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateEscalation: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.items = state.items.map((e) =>
        e.id === updated.id || e.ticketId === updated.ticketId ? { ...e, ...updated } : e
      );
    },
    // DELETE
    deleteEscalation: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((e) => e.id !== id && e.ticketId !== id);
    },
  },
});

export const { createEscalation, readEscalations, updateEscalation, deleteEscalation } = escalationsSlice.actions;
export default escalationsSlice.reducer;
