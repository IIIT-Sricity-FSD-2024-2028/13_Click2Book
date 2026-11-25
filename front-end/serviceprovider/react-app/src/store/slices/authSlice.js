import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  provider: null,
  isAuthenticated: false,
  role: 'PROVIDER',
  sessionVersion: null,
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
      const user = action.payload;
      if (!user) return;
      state.provider = user;
      state.isAuthenticated = true;
      state.role = 'PROVIDER';
      state.sessionVersion = user.sessionVersion ?? 0;
      state.accountAccessError = '';
      state.error = null;
    },
    // READ session
    readSession: (state) => state,
    // UPDATE session
    updateSession: (state, action) => {
      if (action.payload) {
        state.provider = { ...(state.provider || {}), ...action.payload };
        if (action.payload.sessionVersion !== undefined) {
          state.sessionVersion = action.payload.sessionVersion;
        }
      }
    },
    // DELETE session
    deleteSession: (state) => {
      state.provider = null;
      state.isAuthenticated = false;
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
        (action) => action.type === 'auth/loginProvider/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginProvider/fulfilled',
        (state, action) => {
          state.loading = false;
          state.provider = action.payload;
          state.isAuthenticated = true;
          state.role = 'PROVIDER';
          state.sessionVersion = action.payload?.sessionVersion ?? 0;
          state.accountAccessError = '';
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginProvider/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Login failed';
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
