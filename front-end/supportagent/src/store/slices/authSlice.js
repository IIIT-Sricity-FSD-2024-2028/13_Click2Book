import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_AGENTS } from '../../services/mockData';

const initialState = {
  isAuthenticated: false,
  agent: INITIAL_AGENTS[0],
  supporterId: null,
  sessionVersion: null,
  role: 'SUPPORT',
  accountAccessError: '',
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // CREATE session
    createSession: (state, action) => {
      const matched = action.payload;
      state.isAuthenticated = true;
      state.agent = matched;
      state.supporterId = matched?.id || null;
      state.sessionVersion = matched?.sessionVersion ?? 0;
      state.role = 'SUPPORT';
      state.accountAccessError = '';
      state.error = null;
    },
    // READ / hydrate session
    readSession: (state) => state,
    // UPDATE session
    updateSession: (state, action) => {
      if (action.payload) {
        state.agent = { ...(state.agent || {}), ...action.payload };
        if (action.payload.id) state.supporterId = action.payload.id;
        if (action.payload.sessionVersion !== undefined) {
          state.sessionVersion = action.payload.sessionVersion;
        }
      }
    },
    // DELETE session
    deleteSession: (state) => {
      state.isAuthenticated = false;
      state.agent = INITIAL_AGENTS[0];
      state.supporterId = null;
      state.sessionVersion = null;
      state.error = null;
    },
    setAccountAccessError: (state, action) => {
      state.accountAccessError = action.payload || '';
    },
    clearAuthError: (state) => {
      state.error = null;
      state.accountAccessError = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'auth/loginSupportAgent/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginSupportAgent/fulfilled',
        (state, action) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.agent = action.payload;
          state.supporterId = action.payload?.id || null;
          state.sessionVersion = action.payload?.sessionVersion ?? 0;
          state.role = 'SUPPORT';
          state.accountAccessError = '';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginSupportAgent/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Unable to sign in.';
        }
      );
  },
});

export const {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setAccountAccessError,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
