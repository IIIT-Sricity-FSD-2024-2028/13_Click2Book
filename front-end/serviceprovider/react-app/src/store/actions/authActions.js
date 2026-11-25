import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginProvider } from '../../services/api';
import {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setAccountAccessError,
  clearAuthError,
} from '../slices/authSlice';
import { setActiveTab } from '../slices/uiSlice';
import { memStorage } from '../memoryBridge';

export {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setAccountAccessError,
  clearAuthError,
};

export const loginProviderThunk = createAsyncThunk(
  'auth/loginProvider',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const result = await loginProvider(email, password);
      const user = result.data;
      dispatch(setActiveTab('dashboard'));
      if (typeof window !== 'undefined') window.location.hash = 'dashboard';
      return user;
    } catch (err) {
      return rejectWithValue(err.message || 'Invalid credentials. Contact admin if you need access.');
    }
  }
);

export const logoutProviderThunk = () => (dispatch) => {
  memStorage.clear();
  dispatch(deleteSession());
  dispatch(setActiveTab('dashboard'));
  if (typeof window !== 'undefined') {
    window.location.hash = '';
  }
};
