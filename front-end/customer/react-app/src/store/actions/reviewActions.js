import { createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../../services/api';
import { createReview, readReviews, updateReview, deleteReview } from '../slices/reviewsSlice';

export { createReview, readReviews, updateReview, deleteReview };

export const fetchReviewsByTripThunk = createAsyncThunk(
  'reviews/fetchByTrip',
  async (tripId) => {
    const list = await API.reviews.getByTrip(tripId);
    return Array.isArray(list) ? list : [];
  }
);

export const submitReviewThunk = createAsyncThunk(
  'reviews/submitReview',
  async (payload, { dispatch }) => {
    const rev = await API.reviews.submit(payload);
    dispatch(createReview(rev));
    return rev;
  }
);

export const updateReviewThunk = createAsyncThunk(
  'reviews/updateReview',
  async (reviewData, { dispatch }) => {
    dispatch(updateReview(reviewData));
    return reviewData;
  }
);

export const deleteReviewThunk = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { dispatch }) => {
    dispatch(deleteReview(reviewId));
    return reviewId;
  }
);
