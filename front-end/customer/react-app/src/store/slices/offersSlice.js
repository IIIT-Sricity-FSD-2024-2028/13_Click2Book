import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const offersSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    // CREATE
    createOffer: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ / set
    readOffers: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateOffer: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.offerId || updated.id || updated.code;
      const idx = state.items.findIndex((o) => (o.offerId || o.id || o.code) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteOffer: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((o) => (o.offerId || o.id || o.code) !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'offers/fetchActiveOffers/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'offers/fetchActiveOffers/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type === 'offers/fetchActiveOffers/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Could not load offers.';
        }
      );
  },
});

export const { createOffer, readOffers, updateOffer, deleteOffer } = offersSlice.actions;

export default offersSlice.reducer;
