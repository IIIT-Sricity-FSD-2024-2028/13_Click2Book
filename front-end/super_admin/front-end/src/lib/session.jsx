/**
 * Session helpers for the Super Admin portal backed by Redux memory state.
 * Zero browser storage is used.
 */
import {
  clearCustomerSessionState,
  clearSuperUserAuth,
  createSessionRecord,
  setSuperUserAuth,
  updateSessionRecord,
} from '../store/slices/authSlice';

let _store = null;

export function injectSessionStore(store) {
  _store = store;
}

const getAuthState = () => (_store ? _store.getState().auth : null);

export function getSessionValue(key) {
  const auth = getAuthState();
  if (!auth) return null;
  if (key === 'superUserAuth') return auth.superUserAuth ? 'true' : null;
  if (key in auth.session) return auth.session[key] || null;
  return auth.extraKeys?.[key] ?? null;
}

export const isSuperUserAuthenticated = () => Boolean(getAuthState()?.superUserAuth);

export const setSuperUserAuthenticated = (authenticated = true, email = '') => {
  if (_store) _store.dispatch(setSuperUserAuth({ authenticated, email }));
};

export const clearSuperUserAuthenticated = () => {
  if (_store) _store.dispatch(clearSuperUserAuth());
};

/** Normalised role of the currently logged-in user, or `'GUEST'`. */
export const getRole = () => (getSessionValue('c2b_userRole') || 'GUEST').toUpperCase();

export const getCustomerId = () =>
  getSessionValue('c2b_customerId') || getSessionValue('c2b_loggedInId') || 'C001';

export const getUserName = () => getSessionValue('c2b_userName') || 'Guest User';

export const isLoggedIn = () => getSessionValue('c2b_loggedIn') === 'true';

/** Up to two uppercase initials for the sidebar/header avatar pill. */
export const initials = (name) =>
  (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const ROLE_ID_KEY = {
  CUSTOMER: 'c2b_userId',
  PROVIDER: 'c2b_providerId',
  SUPPORT: 'c2b_agentId',
  ADMIN: 'c2b_adminId',
};

/**
 * Copy the active user's ID into the per-role key read by CRUD helpers.
 */
export function syncActiveUserId() {
  const id = getSessionValue('c2b_loggedInId');
  const key = ROLE_ID_KEY[getRole()];
  if (id && key && _store) {
    _store.dispatch(updateSessionRecord({ [key]: id }));
  }
}

/**
 * Save a user's session in Redux memory after login/signup.
 */
export function storeSession(role, { id, name, email } = {}) {
  if (_store) {
    _store.dispatch(createSessionRecord({ role, id, name, email }));
  }
}

/** Where a user lands after signing in from the staff access page. */
export function homeForRole(role) {
  if (role === 'CUSTOMER') return '/';
  if (role === 'PROVIDER' || role === 'SUPPORT' || role === 'ADMIN') return '/';
  return '/';
}

/** Clear all portal session fields in Redux memory. */
export function clearCustomerSession() {
  if (_store) {
    _store.dispatch(clearCustomerSessionState());
  }
}
