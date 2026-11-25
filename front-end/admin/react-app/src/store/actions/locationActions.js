import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../lib/api.js';
import {
  createLocation,
  readLocations,
  updateLocation,
  deleteLocation,
  addApprovedCity,
} from '../slices/locationsSlice';

export { createLocation, readLocations, updateLocation, deleteLocation, addApprovedCity };

export const fetchLocationsThunk = createAsyncThunk(
  'locations/fetchAll',
  async (_, { dispatch }) => {
    const reqRes = await apiFetch('/locations/requests').catch(() => []);
    const requests = Array.isArray(reqRes) ? reqRes : reqRes.data || [];
    const locRes = await apiFetch('/locations').catch(() => []);
    const approvedLocations = Array.isArray(locRes) ? locRes : locRes.data || [];
    dispatch(readLocations({ requests, approvedLocations }));
    return { requests, approvedLocations };
  }
);
