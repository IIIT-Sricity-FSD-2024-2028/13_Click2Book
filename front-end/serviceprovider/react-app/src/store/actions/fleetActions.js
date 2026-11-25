import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getFleetBuses,
  getBackendFleetBuses,
  registerNewBus,
  updateBusStatus,
  deleteBus,
} from '../../services/api';
import {
  createVehicle,
  readFleet,
  updateVehicle,
  deleteVehicle,
  setDeletedBuses,
} from '../slices/fleetSlice';

export { createVehicle, readFleet, updateVehicle, deleteVehicle, setDeletedBuses };

export const fetchFleetThunk = createAsyncThunk(
  'fleet/fetchFleet',
  async (providerId, { dispatch }) => {
    const localFleet = getFleetBuses(providerId);
    dispatch(readFleet(localFleet));
    try {
      const remote = await getBackendFleetBuses(providerId);
      if (Array.isArray(remote) && remote.length > 0) {
        const refreshed = getFleetBuses(providerId);
        dispatch(readFleet(refreshed));
        return refreshed;
      }
    } catch {}
    return localFleet;
  }
);

export const createVehicleThunk = createAsyncThunk(
  'fleet/createVehicle',
  async (busData, { dispatch }) => {
    const res = await registerNewBus(busData);
    dispatch(createVehicle(res?.bus || res || busData));
    return res;
  }
);

export const updateVehicleThunk = createAsyncThunk(
  'fleet/updateVehicle',
  async ({ busId, newStatus }, { dispatch }) => {
    const res = await updateBusStatus(busId, newStatus);
    dispatch(updateVehicle({ vehicleId: busId, id: busId, status: newStatus }));
    return res;
  }
);

export const deleteVehicleThunk = createAsyncThunk(
  'fleet/deleteVehicle',
  async (busId, { dispatch }) => {
    await deleteBus(busId);
    dispatch(deleteVehicle(busId));
    return busId;
  }
);
