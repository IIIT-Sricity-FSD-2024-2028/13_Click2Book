import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  deletedBuses: [],
  loading: false,
  error: null,
};

const fleetSlice = createSlice({
  name: 'fleet',
  initialState,
  reducers: {
    // CREATE
    createVehicle: (state, action) => {
      const bus = action.payload;
      if (!bus) return;
      const id = bus.vehicleId || bus.id;
      const idx = state.items.findIndex((b) => (b.vehicleId || b.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...bus };
      else state.items.unshift(bus);
    },
    // READ / set
    readFleet: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateVehicle: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.vehicleId || updated.id;
      const idx = state.items.findIndex((b) => (b.vehicleId || b.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteVehicle: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((b) => (b.vehicleId || b.id) !== id);
    },
    setDeletedBuses: (state, action) => {
      if (Array.isArray(action.payload)) state.deletedBuses = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'fleet/fetchFleet/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      );
  },
});

export const { createVehicle, readFleet, updateVehicle, deleteVehicle, setDeletedBuses } = fleetSlice.actions;
export default fleetSlice.reducer;
