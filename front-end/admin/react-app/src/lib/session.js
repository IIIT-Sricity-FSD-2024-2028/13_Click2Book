export const DASHBOARD_PATH = '/admin/admin_dashboard.html';
export const SUPER_USER_LOGIN_PATH = '/admin/super-user-login.html';
export const SUPER_USER_AUTH_KEY = 'superUserAuth';

const SESSION_KEYS = ['c2b_loggedIn', 'c2b_userName', 'c2b_userEmail', 'c2b_loggedInId', 'c2b_role'];

export function saveAdminSession(store, user) {
  const values = {
    c2b_loggedIn: 'true',
    c2b_userName: user.name,
    c2b_userEmail: user.email,
    c2b_loggedInId: user.id,
    c2b_role: 'ADMIN',
  };
  Object.entries(values).forEach(([key, value]) => store.setItem(key, value));
  Object.entries(values).forEach(([key, value]) => sessionStorage.setItem(key, value));
}

export function clearAdminSession() {
  SESSION_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function getAdminName() {
  return localStorage.getItem('c2b_userName') || sessionStorage.getItem('c2b_userName') || 'Admin User';
}

export function initialsOf(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function isAdminLoggedIn() {
  return (
    sessionStorage.getItem('c2b_loggedIn') === 'true' ||
    localStorage.getItem('c2b_loggedIn') === 'true'
  );
}

