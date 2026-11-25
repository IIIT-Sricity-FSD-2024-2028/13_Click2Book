import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isLoggedIn: false,
  role: 'CUSTOMER',
  sessionVersion: null,
  loginModal: {
    isOpen: false,
    initialPanel: 'login',
    promptMessage: '',
  },
  redirectAfterLogin: '',
  loginPrompt: '',
  pendingBooking: null,
  returnAfterLogin: '',
  proceedToPassenger: false,
  registeredUsers: [],
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // CREATE session
    createSession: (state, action) => {
      const u = action.payload;
      if (!u) return;
      state.user = { ...u, isLoggedIn: true };
      state.isLoggedIn = true;
      state.role = u.role || 'CUSTOMER';
      state.sessionVersion = u.sessionVersion ?? 0;
      state.error = null;
    },
    // READ session
    readSession: (state) => state,
    // UPDATE session
    updateSession: (state, action) => {
      if (state.user && action.payload) {
        state.user = { ...state.user, ...action.payload, isLoggedIn: true };
        if (action.payload.role) state.role = action.payload.role;
        if (action.payload.sessionVersion !== undefined) {
          state.sessionVersion = action.payload.sessionVersion;
        }
      }
    },
    // DELETE session
    deleteSession: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      state.role = 'CUSTOMER';
      state.sessionVersion = null;
      state.error = null;
    },
    setLoginModal: (state, action) => {
      const opts = action.payload || {};
      state.loginModal = {
        isOpen: opts.isOpen !== undefined ? opts.isOpen : true,
        initialPanel: opts.initialPanel || 'login',
        promptMessage: opts.promptMessage || '',
      };
      if (opts.promptMessage) state.loginPrompt = opts.promptMessage;
      if (opts.redirectAfterLogin) state.redirectAfterLogin = opts.redirectAfterLogin;
    },
    closeLoginModal: (state) => {
      state.loginModal.isOpen = false;
      state.loginModal.promptMessage = '';
      state.loginPrompt = '';
    },
    setRedirectAfterLogin: (state, action) => {
      state.redirectAfterLogin = action.payload || '';
    },
    setPendingBooking: (state, action) => {
      state.pendingBooking = action.payload || null;
      if (action.payload) {
        state.returnAfterLogin = 'passenger';
        state.proceedToPassenger = true;
        state.redirectAfterLogin = '#search-trips';
      }
    },
    clearPendingBookingState: (state) => {
      state.pendingBooking = null;
      state.returnAfterLogin = '';
      state.proceedToPassenger = false;
      state.redirectAfterLogin = '';
      state.loginPrompt = '';
    },
    addRegisteredUser: (state, action) => {
      if (action.payload) {
        state.registeredUsers.unshift(action.payload);
      }
    },
    clearAuthError: (state) => {
      state.error = null;
      state.loginPrompt = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) =>
          action.type === 'auth/loginCustomer/pending' ||
          action.type === 'auth/registerCustomer/pending',
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type === 'auth/loginCustomer/fulfilled' ||
          action.type === 'auth/registerCustomer/fulfilled',
        (state, action) => {
          state.loading = false;
          if (action.payload) {
            state.user = { ...action.payload, isLoggedIn: true };
            state.isLoggedIn = true;
            state.role = action.payload.role || 'CUSTOMER';
            state.sessionVersion = action.payload.sessionVersion ?? 0;
            state.loginModal = { isOpen: false, initialPanel: 'login', promptMessage: '' };
          }
        }
      )
      .addMatcher(
        (action) =>
          action.type === 'auth/loginCustomer/rejected' ||
          action.type === 'auth/registerCustomer/rejected',
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error?.message || 'Authentication failed.';
        }
      );
  },
});

export const {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setLoginModal,
  closeLoginModal,
  setRedirectAfterLogin,
  setPendingBooking,
  clearPendingBookingState,
  addRegisteredUser,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
