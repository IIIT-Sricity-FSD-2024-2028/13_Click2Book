import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    // CREATE
    createReview: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ / set
    readReviews: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateReview: (state, action) => {
      const updated = action.payload;
      if (!updated?.reviewId) return;
      const idx = state.items.findIndex((r) => r.reviewId === updated.reviewId);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteReview: (state, action) => {
      state.items = state.items.filter((r) => r.reviewId !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'reviews/submitReview/fulfilled',
        (state, action) => {
          if (action.payload) {
            state.items = [
              action.payload,
              ...state.items.filter((r) => r.reviewId !== action.payload.reviewId),
            ];
          }
        }
      );
  },
});

export const { createReview, readReviews, updateReview, deleteReview } = reviewsSlice.actions;

export default reviewsSlice.reducer;
