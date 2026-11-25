import { createSlice } from '@reduxjs/toolkit';

export const SUPER_USERS = [
  { email: 'superuser@click2book.com', password: 'super123' },
  { email: 'superadmin@click2book.com', password: 'SuperAdmin@123' },
  { email: 'sarath@click2book.com', password: 'Sarath@123' },
  { email: 'admin@c2b.com', password: 'admin123' },
];

const initialState = {
  superUserAuth: false,
  superUserEmail: '',
  session: {
    c2b_loggedIn: '',
    c2b_loggedInId: '',
    c2b_userName: '',
    c2b_userEmail: '',
    c2b_userRole: '',
    c2b_customerId: '',
    c2b_userId: '',
    c2b_providerId: '',
    c2b_agentId: '',
    c2b_adminId: '',
  },
  extraKeys: {},
  loading: false,
  error: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // CREATE / UPDATE session entry
    createSessionRecord: (state, action) => {
      const { role, id, name, email } = action.payload || {};
      const userId = id != null ? String(id) : '';
      state.session.c2b_loggedIn = 'true';
      state.session.c2b_loggedInId = userId;
      state.session.c2b_userName = name || '';
      state.session.c2b_userEmail = email || '';
      state.session.c2b_userRole = role || '';
      state.session.c2b_customerId = userId;
      if (role === 'CUSTOMER') state.session.c2b_userId = userId;
      if (role === 'PROVIDER') state.session.c2b_providerId = userId;
      if (role === 'SUPPORT') state.session.c2b_agentId = userId;
      if (role === 'ADMIN') state.session.c2b_adminId = userId;
      state.error = '';
    },
    readSessionState: (state) => state,
    updateSessionRecord: (state, action) => {
      const updates = action.payload || {};
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'superUserAuth') {
          state.superUserAuth = value === true || value === 'true';
        } else if (key in state.session) {
          state.session[key] = value != null ? String(value) : '';
        } else if (value === null || value === undefined) {
          delete state.extraKeys[key];
        } else {
          state.extraKeys[key] = String(value);
        }
      });
    },
    deleteSessionRecord: (state, action) => {
      const key = action.payload;
      if (!key) {
        state.session = { ...initialState.session };
        state.extraKeys = {};
        return;
      }
      if (key in state.session) state.session[key] = '';
      delete state.extraKeys[key];
    },
    setSuperUserAuth: (state, action) => {
      const payload = action.payload;
      if (typeof payload === 'boolean') {
        state.superUserAuth = payload;
        if (!payload) state.superUserEmail = '';
      } else {
        state.superUserAuth = Boolean(payload?.authenticated ?? true);
        state.superUserEmail = payload?.email || '';
      }
      state.error = '';
    },
    clearSuperUserAuth: (state) => {
      state.superUserAuth = false;
      state.superUserEmail = '';
      state.error = '';
    },
    clearCustomerSessionState: (state) => {
      Object.keys(state.session).forEach((k) => {
        state.session[k] = '';
      });
      state.extraKeys = {};
    },
    setAuthLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setAuthError: (state, action) => {
      state.error = action.payload || '';
    },
    clearAuthTransient: (state) => {
      state.error = '';
      state.loading = false;
    },
  },
});

export const {
  createSessionRecord,
  readSessionState,
  updateSessionRecord,
  deleteSessionRecord,
  setSuperUserAuth,
  clearSuperUserAuth,
  clearCustomerSessionState,
  setAuthLoading,
  setAuthError,
  clearAuthTransient,
} = authSlice.actions;

export default authSlice.reducer;
