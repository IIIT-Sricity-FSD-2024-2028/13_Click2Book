import { createAsyncThunk } from '@reduxjs/toolkit';
import { replyToReview, deleteReviewReply } from '../../services/api';
import { createReview, readReviews, updateReview, deleteReview } from '../slices/reviewsSlice';

export { createReview, readReviews, updateReview, deleteReview };

export const replyToReviewThunk = createAsyncThunk(
  'reviews/replyToReview',
  async ({ reviewId, replyText, providerName }, { dispatch }) => {
    const res = replyToReview(reviewId, replyText, providerName);
    dispatch(updateReview({ reviewId, providerReply: replyText, repliedAt: new Date().toISOString() }));
    return res;
  }
);

export const deleteReviewReplyThunk = createAsyncThunk(
  'reviews/deleteReply',
  async (reviewId, { dispatch }) => {
    const res = deleteReviewReply(reviewId);
    dispatch(updateReview({ reviewId, providerReply: null, repliedAt: null }));
    return res;
  }
);
