import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getLocalSchedules,
  fetchSchedulesFromAPI,
  saveSchedule,
  updateLocalSchedule,
  deleteLocalSchedule,
  autoStartDueTrips,
} from '../../services/api';
import {
  createSchedule,
  readSchedules,
  updateSchedule,
  deleteSchedule,
  setTripStatus,
  setTripStatuses,
} from '../slices/schedulesSlice';

export {
  createSchedule,
  readSchedules,
  updateSchedule,
  deleteSchedule,
  setTripStatus,
  setTripStatuses,
};

export const fetchSchedulesThunk = createAsyncThunk(
  'schedules/fetchSchedules',
  async (providerId, { dispatch }) => {
    const local = getLocalSchedules(providerId);
    dispatch(readSchedules(local));
    try {
      const apiScheds = await fetchSchedulesFromAPI(providerId);
      if (Array.isArray(apiScheds)) {
        const merged = getLocalSchedules(providerId);
        dispatch(readSchedules(merged));
        return merged;
      }
    } catch {}
    return local;
  }
);

export const createScheduleThunk = createAsyncThunk(
  'schedules/createSchedule',
  async (payload, { dispatch }) => {
    const res = await saveSchedule(payload);
    if (res?.schedule) dispatch(createSchedule(res.schedule));
    return res;
  }
);

export const updateScheduleThunk = createAsyncThunk(
  'schedules/updateSchedule',
  async ({ tripId, payload }, { dispatch }) => {
    const res = updateLocalSchedule(tripId, payload);
    dispatch(updateSchedule({ id: tripId, tripId, ...payload }));
    return res;
  }
);

export const deleteScheduleThunk = createAsyncThunk(
  'schedules/deleteSchedule',
  async ({ tripId, tripMeta }, { dispatch }) => {
    const res = deleteLocalSchedule(tripId, tripMeta);
    dispatch(deleteSchedule(tripId));
    return res;
  }
);

export const autoStartDueTripsThunk = createAsyncThunk(
  'schedules/autoStartDue',
  async (additionalTrips = []) => autoStartDueTrips(additionalTrips)
);
