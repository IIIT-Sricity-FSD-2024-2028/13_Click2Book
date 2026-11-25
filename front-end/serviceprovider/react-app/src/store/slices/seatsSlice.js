import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  blockedByTrip: {},
  seatBlocks: [],
  loading: false,
  error: null,
};

const seatsSlice = createSlice({
  name: 'seats',
  initialState,
  reducers: {
    // CREATE
    createSeatBlock: (state, action) => {
      const { tripId, seatId } = action.payload || {};
      if (!tripId || !seatId) return;
      const list = state.blockedByTrip[tripId] || [];
      if (!list.includes(seatId)) {
        state.blockedByTrip[tripId] = [...list, seatId];
      }
    },
    // READ
    readSeatBlocks: (state, action) => {
      if (action.payload && typeof action.payload === 'object') {
        state.blockedByTrip = action.payload;
      }
    },
    // UPDATE
    updateSeatBlock: (state, action) => {
      const { tripId, seatIds } = action.payload || {};
      if (tripId && Array.isArray(seatIds)) {
        state.blockedByTrip[tripId] = seatIds;
      }
    },
    // DELETE
    deleteSeatBlock: (state, action) => {
      const { tripId, seatId } = action.payload || {};
      if (!tripId) return;
      if (seatId) {
        state.blockedByTrip[tripId] = (state.blockedByTrip[tripId] || []).filter((s) => s !== seatId);
      } else {
        delete state.blockedByTrip[tripId];
      }
    },
  },
});

export const { createSeatBlock, readSeatBlocks, updateSeatBlock, deleteSeatBlock } = seatsSlice.actions;
export default seatsSlice.reducer;
