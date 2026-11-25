import { createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '../../services/api';
import {
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
} from '../slices/authSlice';
import { setActiveTab } from '../slices/uiSlice';
import { showToastThunk } from './uiActions';

export {
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
};

export const loginCustomerThunk = createAsyncThunk(
  'auth/loginCustomer',
  async ({ email, password }, { dispatch, getState, rejectWithValue }) => {
    try {
      const user = await API.auth.login(email, password);
      const loggedUser = {
        id: user.id || user.customerId || 'C001',
        name: user.name,
        email: user.email,
        phone: user.phoneNumber || user.phone || '',
        avatar: user.avatar || '',
        role: user.role || 'CUSTOMER',
        sessionVersion: user.sessionVersion ?? 0,
        isLoggedIn: true,
      };
      dispatch(showToastThunk(`👋 Welcome back, ${loggedUser.name.split(' ')[0]}!`, 'success'));

      const state = getState();
      const hasPending =
        Boolean(state.auth.pendingBooking) || state.auth.proceedToPassenger || state.auth.returnAfterLogin === 'passenger';

      if (hasPending) {
        dispatch(setRedirectAfterLogin(''));
        dispatch(setActiveTab('search-trips'));
        if (typeof window !== 'undefined') window.location.hash = '#search-trips';
      } else if (typeof window !== 'undefined') {
        const curHash = window.location.hash || '';
        if (
          curHash.includes('login') ||
          curHash.includes('signup') ||
          !curHash ||
          curHash === '#' ||
          curHash === '#landing'
        ) {
          const redirect = state.auth.redirectAfterLogin || '#search-trips';
          dispatch(setRedirectAfterLogin(''));
          const targetTab = redirect.replace('#', '').split('?')[0] || 'search-trips';
          dispatch(setActiveTab(targetTab));
          window.location.hash = redirect;
        } else if (state.auth.redirectAfterLogin) {
          const redirect = state.auth.redirectAfterLogin;
          dispatch(setRedirectAfterLogin(''));
          const targetTab = redirect.replace('#', '').split('?')[0];
          if (targetTab) {
            dispatch(setActiveTab(targetTab));
            window.location.hash = redirect;
          }
        }
      }

      return loggedUser;
    } catch (err) {
      return rejectWithValue(err.message || 'Invalid email or password.');
    }
  }
);

export const registerCustomerThunk = createAsyncThunk(
  'auth/registerCustomer',
  async ({ name, email, password, phone, age = 25, gender = 'MALE' }, { dispatch, getState, rejectWithValue }) => {
    try {
      const res = await API.auth.register(name, email, password, phone, age, gender);
      const createdUser = {
        id: res?.customerId || res?.id || `CUST-${Date.now()}`,
        name: res?.name || name,
        email: res?.email || email,
        phone: res?.phoneNumber || phone,
        role: 'CUSTOMER',
        sessionVersion: res?.sessionVersion ?? 0,
        isLoggedIn: true,
      };
      dispatch(addRegisteredUser(createdUser));
      dispatch(showToastThunk('Account created successfully! Welcome to Click2Book.', 'success'));

      const state = getState();
      if (typeof window !== 'undefined') {
        const curHash = window.location.hash || '';
        if (curHash.includes('login') || curHash.includes('signup') || !curHash || curHash === '#') {
          const redirect = state.auth.redirectAfterLogin || '#search-trips';
          dispatch(setRedirectAfterLogin(''));
          const targetTab = redirect.replace('#', '').split('?')[0] || 'search-trips';
          dispatch(setActiveTab(targetTab));
          window.location.hash = redirect;
        }
      }

      return createdUser;
    } catch (err) {
      return rejectWithValue(err.message || 'Account registration failed.');
    }
  }
);

export const updateCustomerProfileThunk = createAsyncThunk(
  'auth/updateCustomerProfile',
  async ({ id, data }, { dispatch }) => {
    try {
      if (id) {
        await API.customers.updateProfile(id, data);
      }
    } catch {
      // Offline fallback ok
    }
    dispatch(updateSession(data));
    return data;
  }
);

export const uploadCustomerAvatarThunk = createAsyncThunk(
  'auth/uploadCustomerAvatar',
  async ({ id, file, dataUrl }, { dispatch }) => {
    dispatch(updateSession({ avatar: dataUrl }));
    try {
      if (id && file) {
        await API.customers.uploadProfilePicture(file, id);
      }
    } catch {
      // Base64 kept in Redux memory state
    }
    return dataUrl;
  }
);

export const logoutCustomerThunk = () => (dispatch) => {
  dispatch(deleteSession());
  dispatch(clearPendingBookingState());
  dispatch(setActiveTab('landing'));
  if (typeof window !== 'undefined') {
    window.location.hash = '';
  }
  dispatch(showToastThunk('👋 You have been logged out.', 'info'));
};
