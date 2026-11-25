import { createSlice } from '@reduxjs/toolkit';

const todayStr = new Date().toISOString().split('T')[0];

const initialState = {
  items: [], // bus schedules / trips
  fleet: [],
  deletedBuses: [],
  tripStatuses: {},
  seatBlocks: [],
  searchFrom: 'MUMBAI',
  searchTo: 'PUNE',
  searchDate: todayStr,
  autoSearch: false,
  availableCities: [
    'MUMBAI', 'PUNE', 'BANGALORE', 'CHENNAI', 'HYDERABAD',
    'DELHI', 'JAIPUR', 'AHMEDABAD', 'KOLKATA', 'GOA', 'SURAT',
    'KOCHI', 'NAGPUR', 'INDORE', 'CHANDIGARH', 'LUCKNOW',
    'BHOPAL', 'VISAKHAPATNAM', 'COIMBATORE', 'MYSORE',
    'VIJAYAWADA', 'TIRUPATI', 'MANGALORE', 'MADURAI', 'TRIVANDRUM',
  ],
  fleetCleaned: false,
  loading: false,
  error: null,
};

const tripsSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    // CREATE
    createTrip: (state, action) => {
      const trip = action.payload;
      if (!trip) return;
      const tid = trip.id || trip.tripId;
      const idx = state.items.findIndex((t) => (t.id || t.tripId) === tid);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...trip };
      else state.items.unshift(trip);
    },
    // READ / set
    readTrips: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      }
    },
    // UPDATE
    updateTrip: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const tid = updated.id || updated.tripId;
      const idx = state.items.findIndex((t) => (t.id || t.tripId) === tid);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
      else state.items.unshift(updated);
    },
    // DELETE
    deleteTrip: (state, action) => {
      const tid = action.payload;
      state.items = state.items.filter((t) => (t.id || t.tripId) !== tid);
    },
    setFleet: (state, action) => {
      if (Array.isArray(action.payload)) state.fleet = action.payload;
    },
    setDeletedBuses: (state, action) => {
      if (Array.isArray(action.payload)) state.deletedBuses = action.payload;
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
    setSeatBlocks: (state, action) => {
      if (Array.isArray(action.payload)) state.seatBlocks = action.payload;
    },
    setSearchParams: (state, action) => {
      const { from, to, date, autoSearch } = action.payload || {};
      if (from !== undefined) state.searchFrom = from;
      if (to !== undefined) state.searchTo = to;
      if (date !== undefined) state.searchDate = date;
      if (autoSearch !== undefined) state.autoSearch = Boolean(autoSearch);
    },
    setAutoSearch: (state, action) => {
      state.autoSearch = Boolean(action.payload);
    },
    setAvailableCities: (state, action) => {
      if (Array.isArray(action.payload)) state.availableCities = action.payload;
    },
    markFleetCleaned: (state) => {
      state.fleetCleaned = true;
    },
    clearSearchTransient: (state) => {
      state.autoSearch = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'trips/searchTrips/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'trips/searchTrips/fulfilled',
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) => action.type === 'trips/searchTrips/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Failed to search trips';
        }
      );
  },
});

export const {
  createTrip,
  readTrips,
  updateTrip,
  deleteTrip,
  setFleet,
  setDeletedBuses,
  setTripStatus,
  setTripStatuses,
  setSeatBlocks,
  setSearchParams,
  setAutoSearch,
  setAvailableCities,
  markFleetCleaned,
  clearSearchTransient,
} = tripsSlice.actions;

export default tripsSlice.reducer;
