import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../../lib/api.js';
import {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setSuperUserAuthed,
  setRoute,
  clearAuthError,
} from '../slices/authSlice';
import { setSection } from '../slices/uiSlice';

export {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setSuperUserAuthed,
  setRoute,
  clearAuthError,
};

export const loginAdminThunk = createAsyncThunk(
  'auth/loginAdmin',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();
      if (!response.ok || !json.success || json.data?.role !== 'ADMIN') {
        throw new Error(json.message || 'Invalid credentials. Check your admin email and password.');
      }
      dispatch(setSection('dashboard'));
      if (typeof window !== 'undefined') window.location.hash = '#dashboard';
      return json.data;
    } catch (requestError) {
      return rejectWithValue(
        requestError instanceof TypeError
          ? 'Admin API is unavailable. Please try again.'
          : requestError.message
      );
    }
  }
);

export const logoutAdminThunk = () => (dispatch) => {
  dispatch(deleteSession());
  dispatch(setSection('dashboard'));
  if (typeof window !== 'undefined') {
    window.location.hash = '#login';
  }
};
