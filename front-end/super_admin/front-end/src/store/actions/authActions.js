import {
  SUPER_USERS,
  createSessionRecord,
  updateSessionRecord,
  deleteSessionRecord,
  setSuperUserAuth,
  clearSuperUserAuth,
  clearCustomerSessionState,
  setAuthLoading,
  setAuthError,
  clearAuthTransient,
} from '../slices/authSlice';

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export const loginSuperAdminThunk = ({ email, password }) => async (dispatch) => {
  dispatch(setAuthError(''));
  const mail = String(email || '').trim();
  if (!mail) {
    const msg = 'Please enter your supervisor email.';
    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
  if (!EMAIL_RE.test(mail)) {
    const msg = 'Please enter a valid email address (e.g. superuser@click2book.com).';
    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
  if (!password) {
    const msg = 'Please enter your access key.';
    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
  if (password.length < 6) {
    const msg = 'Access key must be at least 6 characters.';
    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }
  const matched = SUPER_USERS.find(
    (u) => u.email.toLowerCase() === mail.toLowerCase() && u.password === password,
  );
  if (!matched) {
    const msg = 'Invalid Super Admin credentials. Please check your email and access key.';
    dispatch(setAuthError(msg));
    return { success: false, error: msg };
  }

  dispatch(setAuthLoading(true));
  dispatch(setSuperUserAuth({ authenticated: true, email: matched.email }));
  dispatch(setAuthLoading(false));
  return { success: true, email: matched.email };
};

export const logoutSuperAdminThunk = () => (dispatch) => {
  dispatch(clearSuperUserAuth());
};

export const storePortalSessionThunk = (role, info) => (dispatch) => {
  dispatch(createSessionRecord({ role, ...info }));
};

export const updatePortalSessionThunk = (updates) => (dispatch) => {
  dispatch(updateSessionRecord(updates));
};

export const removePortalSessionKeyThunk = (key) => (dispatch) => {
  dispatch(deleteSessionRecord(key));
};

export const clearPortalSessionThunk = () => (dispatch) => {
  dispatch(clearCustomerSessionState());
};

export const clearAuthErrorsAction = () => (dispatch) => {
  dispatch(clearAuthTransient());
};
