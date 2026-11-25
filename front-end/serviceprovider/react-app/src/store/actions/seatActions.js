import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSeatData,
  blockSeat,
  unblockSeat,
} from '../../services/api';
import {
  createSeatBlock,
  readSeatBlocks,
  updateSeatBlock,
  deleteSeatBlock,
} from '../slices/seatsSlice';

export { createSeatBlock, readSeatBlocks, updateSeatBlock, deleteSeatBlock };

export const fetchSeatDataThunk = createAsyncThunk(
  'seats/fetchSeatData',
  async (providerId) => getSeatData(providerId)
);

export const blockSeatThunk = createAsyncThunk(
  'seats/blockSeat',
  async ({ tripId, seatId }, { dispatch }) => {
    blockSeat(tripId, seatId);
    dispatch(createSeatBlock({ tripId, seatId }));
    return { tripId, seatId };
  }
);

export const unblockSeatThunk = createAsyncThunk(
  'seats/unblockSeat',
  async ({ tripId, seatId, bookedSeatList = [] }, { dispatch }) => {
    unblockSeat(tripId, seatId, bookedSeatList);
    dispatch(deleteSeatBlock({ tripId, seatId }));
    return { tripId, seatId };
  }
);
