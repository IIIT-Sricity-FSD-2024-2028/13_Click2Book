/**
 * Session helpers shared by every portal.
 *
 * Login pages write the signed-in user into sessionStorage and/or
 * localStorage under `c2b_*` keys; everything else reads them back here.
 */

const ss = (k) => sessionStorage.getItem(k);
const ls = (k) => localStorage.getItem(k);

/** Read a key from sessionStorage first, then localStorage. */
export function getSessionValue(key) {
  return ss(key) || ls(key);
}

export function getRole(fallback = 'CUSTOMER') {
  return getSessionValue('c2b_role') || fallback;
}

/** Current customer ID, falling back to the demo customer C001. */
export function getCustomerId() {
  return getSessionValue('c2b_loggedInId') || getSessionValue('c2b_userId') || 'C001';
}

export function getUserName(fallback = 'Customer') {
  return getSessionValue('c2b_userName') || fallback;
}

export function isLoggedIn() {
  return ss('c2b_loggedIn') === 'true' || ls('c2b_loggedIn') === 'true';
}

export function initials(name, fallback = 'CU') {
  const ini = String(name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return ini || fallback;
}

/** Keep c2b_userId and c2b_loggedInId pointing at the same account. */
export function syncActiveUserId() {
  const activeId = getSessionValue('c2b_loggedInId') || getSessionValue('c2b_userId');
  if (!activeId) return;
  for (const store of [sessionStorage, localStorage]) {
    store.setItem('c2b_loggedInId', activeId);
    store.setItem('c2b_userId', activeId);
  }
}

/**
 * Write a signed-in user ({ id, name, email, role }) into the given stores.
 * sessionStorage is always written; pass `remember` to also persist it.
 */
export function storeSession(user, { remember = false, also = [] } = {}) {
  const stores = new Set([sessionStorage, ...(remember ? [localStorage] : []), ...also]);
  for (const store of stores) {
    store.setItem('c2b_loggedIn', 'true');
    store.setItem('c2b_userName', user.name);
    store.setItem('c2b_userId', user.id || '');
    store.setItem('c2b_loggedInId', user.id || '');
    store.setItem('c2b_role', user.role);
    store.setItem('c2b_userEmail', user.email || '');
  }
}

/** Landing route for each role after signing in. */
export function homeForRole(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/admin-dashboard';
    case 'PROVIDER':
      return '/provider/dashboard';
    case 'SUPPORT':
      return '/support';
    default:
      return '/customer/search-trips';
  }
}

const CUSTOMER_KEYS = ['c2b_loggedIn', 'c2b_userName', 'c2b_userId', 'c2b_loggedInId', 'c2b_userEmail'];

export function clearCustomerSession() {
  for (const key of CUSTOMER_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
