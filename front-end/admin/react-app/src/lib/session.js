import { createSession, deleteSession } from '../store/slices/authSlice';

export const DASHBOARD_PATH = '/admin/admin_dashboard.html';
export const SUPER_USER_LOGIN_PATH = '/admin/super-user-login.html';
export const SUPER_USER_AUTH_KEY = 'superUserAuth';

let _storeRef = null;
export function injectAdminSessionStore(store) {
  _storeRef = store;
}

export function saveAdminSession(_storeIgnored, user) {
  if (_storeRef && user) {
    _storeRef.dispatch(createSession(user));
  }
}

export function clearAdminSession() {
  if (_storeRef) {
    _storeRef.dispatch(deleteSession());
  }
}

export function getAdminName() {
  return (_storeRef && _storeRef.getState()?.auth?.user?.name) || 'Admin User';
}

export function initialsOf(name) {
  return String(name || 'AU')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function isAdminLoggedIn() {
  return Boolean(_storeRef && _storeRef.getState()?.auth?.isLoggedIn);
}
