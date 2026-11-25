import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requests: [],
  approvedLocations: [],
  approvedCities: [],
  loading: false,
  error: null,
};

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    // CREATE
    createLocation: (state, action) => {
      if (action.payload) state.approvedLocations.unshift(action.payload);
    },
    // READ
    readLocations: (state, action) => {
      if (Array.isArray(action.payload?.requests)) state.requests = action.payload.requests;
      if (Array.isArray(action.payload?.approvedLocations)) {
        state.approvedLocations = action.payload.approvedLocations;
        state.approvedCities = action.payload.approvedLocations.map((l) => l.name).filter(Boolean);
      }
    },
    // UPDATE
    updateLocation: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.requests = state.requests.map((r) =>
        r.requestId === updated.requestId ? { ...r, ...updated } : r
      );
    },
    // DELETE
    deleteLocation: (state, action) => {
      const id = action.payload;
      state.approvedLocations = state.approvedLocations.filter((l) => (l.locationId || l.id) !== id);
      state.requests = state.requests.filter((r) => r.requestId !== id);
    },
    addApprovedCity: (state, action) => {
      const name = action.payload;
      if (name && !state.approvedCities.some((c) => c.toLowerCase() === name.toLowerCase())) {
        state.approvedCities.push(name);
      }
    },
  },
});

export const {
  createLocation,
  readLocations,
  updateLocation,
  deleteLocation,
  addApprovedCity,
} = locationsSlice.actions;

export default locationsSlice.reducer;
