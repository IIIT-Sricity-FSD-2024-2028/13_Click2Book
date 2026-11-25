import { createAsyncThunk } from '@reduxjs/toolkit';
import { liveSync } from '../../services/liveSync';
import {
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
} from '../slices/tripsSlice';

export {
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
};

export const refreshSyncStateThunk = createAsyncThunk(
  'trips/refreshSyncState',
  async () => {
    await liveSync.refreshStateFromBackend();
    return true;
  }
);

export const createTripThunk = createAsyncThunk(
  'trips/createTrip',
  async (tripData, { dispatch }) => {
    dispatch(createTrip(tripData));
    return tripData;
  }
);

export const updateTripThunk = createAsyncThunk(
  'trips/updateTrip',
  async (tripData, { dispatch }) => {
    dispatch(updateTrip(tripData));
    return tripData;
  }
);

export const deleteTripThunk = createAsyncThunk(
  'trips/deleteTrip',
  async (tripId, { dispatch }) => {
    dispatch(deleteTrip(tripId));
    return tripId;
  }
);
