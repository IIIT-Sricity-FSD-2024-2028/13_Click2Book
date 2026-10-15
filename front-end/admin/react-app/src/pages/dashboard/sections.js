// [id, sidebar label, page title, sidebar icon]
export const SECTIONS = [
  ['dashboard', 'Overview', 'Dashboard Overview', '▦'],
  ['bookings', 'Bookings', 'All Bookings', '▤'],
  ['users', 'User Accounts', 'User Accounts Management', '👥'],
  ['providers', 'Service Providers', 'Service Provider Management', '🚌'],
  ['support', 'Customer Support', 'Customer Support Management', '💬'],
  ['refund', 'Refunds', 'Refund Requests & Decisions', '↻'],
  ['reports', 'Analytics', 'Reports & Route Analytics', '📊'],
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
