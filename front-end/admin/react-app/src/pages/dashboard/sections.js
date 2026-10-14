// [id, sidebar label, page title, sidebar icon]
export const SECTIONS = [
  ['dashboard', 'Dashboard', 'Dashboard Overview', '▦'],
  ['bookings', 'Daily Bookings', 'All Bookings', '▤'],
  ['users', 'Manage Users', 'User Accounts', '♙'],
  ['refund', 'Refund Management', 'Refund Requests', '↻'],
  ['reports', 'Reports', 'Reports & Analytics', '▥'],
];

export const BOOKING_STATUSES = ['confirmed', 'pending', 'cancelled', 'completed'];
export const USER_ROLES = ['admin', 'customer', 'support', 'service_provider'];

const SECTION_KEY = 'c2b_currentPage';

export function loadSavedSection() {
  const saved = localStorage.getItem(SECTION_KEY) || 'dashboard';
  return SECTIONS.some(([id]) => id === saved) ? saved : 'dashboard';
}

export function saveSection(id) {
  localStorage.setItem(SECTION_KEY, id);
}
