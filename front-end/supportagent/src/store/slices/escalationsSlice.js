import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_ESCALATIONS_RESOLVED } from '../../services/mockData';

const initialState = {
  providerEscalations: [],
  resolvedEscalations: INITIAL_ESCALATIONS_RESOLVED,
  loading: false,
  error: null,
};

const escalationsSlice = createSlice({
  name: 'escalations',
  initialState,
  reducers: {
    // CREATE
    createEscalation: (state, action) => {
      const esc = action.payload;
      if (!esc) return;
      state.providerEscalations = [
        esc,
        ...state.providerEscalations.filter((e) => e.ticketId !== esc.ticketId),
      ];
    },
    // READ / set
    readEscalations: (state, action) => {
      if (Array.isArray(action.payload?.providerEscalations)) {
        state.providerEscalations = action.payload.providerEscalations;
      }
      if (Array.isArray(action.payload?.resolvedEscalations)) {
        state.resolvedEscalations = action.payload.resolvedEscalations;
      }
    },
    // UPDATE
    updateEscalation: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.providerEscalations = state.providerEscalations.map((e) =>
        e.id === updated.id || e.ticketId === updated.ticketId
          ? { ...e, ...updated }
          : e
      );
    },
    // DELETE
    deleteEscalation: (state, action) => {
      const id = action.payload;
      state.providerEscalations = state.providerEscalations.filter(
        (e) => e.id !== id && e.ticketId !== id
      );
    },
    addResolvedEscalation: (state, action) => {
      if (action.payload) {
        state.resolvedEscalations.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'escalations/fetchEscalations/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload?.providerEscalations)) {
            state.providerEscalations = action.payload.providerEscalations;
          }
          if (Array.isArray(action.payload?.resolvedEscalations)) {
            state.resolvedEscalations = action.payload.resolvedEscalations;
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'escalations/createEscalation/fulfilled',
        (state, action) => {
          if (action.payload) {
            state.providerEscalations = [
              action.payload,
              ...state.providerEscalations.filter((e) => e.ticketId !== action.payload.ticketId),
            ];
          }
        }
      )
      .addMatcher(
        (action) => action.type === 'escalations/updateEscalation/fulfilled',
        (state, action) => {
          const updated = action.payload;
          if (!updated) return;
          state.providerEscalations = state.providerEscalations.map((e) =>
            e.id === updated.id || e.ticketId === updated.ticketId ? { ...e, ...updated } : e
          );
        }
      )
      .addMatcher(
        (action) => action.type === 'escalations/deleteEscalation/fulfilled',
        (state, action) => {
          state.providerEscalations = state.providerEscalations.filter(
            (e) => e.id !== action.payload && e.ticketId !== action.payload
          );
        }
      );
  },
});

export const {
  createEscalation,
  readEscalations,
  updateEscalation,
  deleteEscalation,
  addResolvedEscalation,
} = escalationsSlice.actions;

export default escalationsSlice.reducer;
