import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    // CREATE
    createCoupon: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readCoupons: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateCoupon: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.id || updated.offerId || updated.code;
      const idx = state.items.findIndex((c) => (c.id || c.offerId || c.code) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteCoupon: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((c) => (c.id || c.offerId || c.code) !== id);
    },
  },
});

export const { createCoupon, readCoupons, updateCoupon, deleteCoupon } = couponsSlice.actions;
export default couponsSlice.reducer;
