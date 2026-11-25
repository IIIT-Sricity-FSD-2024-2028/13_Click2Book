import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  user: null,
  adminId: 'A001',
  role: 'ADMIN',
  superUserAuthed: false,
  route: 'login',
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
      state.isLoggedIn = true;
      state.user = user;
      state.adminId = user.id || 'A001';
      state.role = 'ADMIN';
      state.error = null;
    },
    // READ session
    readSession: (state) => state,
    // UPDATE session
    updateSession: (state, action) => {
      if (action.payload) {
        state.user = { ...(state.user || {}), ...action.payload };
        if (action.payload.id) state.adminId = action.payload.id;
      }
    },
    // DELETE session
    deleteSession: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.adminId = 'A001';
      state.superUserAuthed = false;
      state.route = 'login';
      state.error = null;
    },
    setSuperUserAuthed: (state, action) => {
      state.superUserAuthed = Boolean(action.payload);
    },
    setRoute: (state, action) => {
      state.route = action.payload || 'login';
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'auth/loginAdmin/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginAdmin/fulfilled',
        (state, action) => {
          state.loading = false;
          state.isLoggedIn = true;
          state.user = action.payload;
          state.adminId = action.payload?.id || 'A001';
          state.route = 'dashboard';
        }
      )
      .addMatcher(
        (action) => action.type === 'auth/loginAdmin/rejected',
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
  setSuperUserAuthed,
  setRoute,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
