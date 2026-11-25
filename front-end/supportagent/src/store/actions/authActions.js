import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../../services/api';
import {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setAccountAccessError,
  clearAuthError,
} from '../slices/authSlice';
import { setActiveTab } from '../slices/uiSlice';
import { clearTicketSelections } from '../slices/ticketsSlice';
import { showToastThunk } from './uiActions';

export {
  createSession,
  readSession,
  updateSession,
  deleteSession,
  setAccountAccessError,
  clearAuthError,
};

export const loginSupportAgentThunk = createAsyncThunk(
  'auth/loginSupportAgent',
  async ({ email, password, matched }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000),
      });
      const json = await response.json().catch(() => ({}));
      const userData = json?.data;
      if (!response.ok || !json.success || userData?.role !== 'SUPPORT') {
        const message =
          json.message || 'Invalid credentials. Please enter a valid support agent email and password.';
        if (message.includes('customer support account has been deactivated')) {
          dispatch(deleteSession());
        }
        return rejectWithValue(message);
      }

      const loggedAgent = {
        ...(matched || {}),
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: 'SUPPORT',
        sessionVersion: userData.sessionVersion ?? 0,
      };
      dispatch(setActiveTab('dashboard'));
      if (typeof window !== 'undefined') {
        window.location.hash = 'dashboard';
      }
      dispatch(
        showToastThunk(
          `Welcome back, ${loggedAgent?.name || 'Support Agent'}! Support Desk initialized.`,
          'success'
        )
      );
      return loggedAgent;
    } catch (requestError) {
      return rejectWithValue(
        requestError instanceof TypeError
          ? 'The service is temporarily unavailable. Please try again.'
          : requestError.message || 'Unable to sign in. Please try again.'
      );
    }
  }
);

export const logoutSupportAgentThunk = () => (dispatch) => {
  dispatch(deleteSession());
  dispatch(clearTicketSelections());
  dispatch(setActiveTab('login'));
  if (typeof window !== 'undefined') {
    window.location.hash = 'login';
  }
  dispatch(showToastThunk('You have been logged out securely.', 'info'));
};
