import { createAsyncThunk } from '@reduxjs/toolkit';
import { getBackendProviderCoupons } from '../../services/api';
import { createCoupon, readCoupons, updateCoupon, deleteCoupon } from '../slices/couponsSlice';

export { createCoupon, readCoupons, updateCoupon, deleteCoupon };

export const fetchCouponsThunk = createAsyncThunk(
  'coupons/fetchCoupons',
  async (providerId, { dispatch }) => {
    const list = await getBackendProviderCoupons(providerId);
    if (Array.isArray(list)) dispatch(readCoupons(list));
    return list;
  }
);
