import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const routesSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    // CREATE
    createRoute: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readRoutes: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateRoute: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.routeId || updated.id;
      const idx = state.items.findIndex((r) => (r.routeId || r.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteRoute: (state, action) => {
      state.items = state.items.filter((r) => (r.routeId || r.id) !== action.payload);
    },
  },
});

export const { createRoute, readRoutes, updateRoute, deleteRoute } = routesSlice.actions;
export default routesSlice.reducer;
