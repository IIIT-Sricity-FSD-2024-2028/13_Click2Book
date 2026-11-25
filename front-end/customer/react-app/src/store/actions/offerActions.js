import { createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../../services/api';
import { createOffer, readOffers, updateOffer, deleteOffer } from '../slices/offersSlice';

export { createOffer, readOffers, updateOffer, deleteOffer };

export const fetchActiveOffersThunk = createAsyncThunk(
  'offers/fetchActiveOffers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await API.offers.getActive();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.message || 'Could not load offers.');
    }
  }
);

export const createOfferThunk = createAsyncThunk(
  'offers/createOffer',
  async (offerData, { dispatch }) => {
    dispatch(createOffer(offerData));
    return offerData;
  }
);

export const updateOfferThunk = createAsyncThunk(
  'offers/updateOffer',
  async (offerData, { dispatch }) => {
    dispatch(updateOffer(offerData));
    return offerData;
  }
);

export const deleteOfferThunk = createAsyncThunk(
  'offers/deleteOffer',
  async (offerId, { dispatch }) => {
    dispatch(deleteOffer(offerId));
    return offerId;
  }
);
