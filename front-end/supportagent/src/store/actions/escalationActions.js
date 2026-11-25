import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  createEscalation,
  readEscalations,
  updateEscalation,
  deleteEscalation,
  addResolvedEscalation,
} from '../slices/escalationsSlice';

export {
  createEscalation,
  readEscalations,
  updateEscalation,
  deleteEscalation,
  addResolvedEscalation,
};

export const fetchEscalationsThunk = createAsyncThunk(
  'escalations/fetchEscalations',
  async (_, { getState }) => ({
    providerEscalations: getState().escalations.providerEscalations,
    resolvedEscalations: getState().escalations.resolvedEscalations,
  })
);

export const createEscalationThunk = createAsyncThunk(
  'escalations/createEscalation',
  async (escalationData) => escalationData
);

export const updateEscalationThunk = createAsyncThunk(
  'escalations/updateEscalation',
  async (escalationData) => escalationData
);

export const deleteEscalationThunk = createAsyncThunk(
  'escalations/deleteEscalation',
  async (escalationId) => escalationId
);
