import { setSection } from '../store/slices/uiSlice';

// [id, sidebar label, page title, sidebar icon]
export const SECTIONS = [
  ['dashboard', 'Overview', 'Dashboard Overview', '▦'],
  ['bookings', 'Bookings', 'All Bookings', '▤'],
  ['users', 'User Accounts', 'User Accounts Management', '👥'],
  ['providers', 'Service Providers', 'Service Provider Management', '🚌'],
  ['support', 'Customer Support', 'Customer Support Management', '💬'],
  ['refund', 'Refunds', 'Refund Requests & Decisions', '↻'],
  ['coupons', 'Coupons', 'Coupon Management', '%'],
  ['locations', 'Locations & Hubs', 'Location Requests & OSM Hubs', '📍'],
  ['reports', 'Analytics', 'Reports & Route Analytics', '📊'],
];

export const BOOKING_STATUSES = ['confirmed', 'pending', 'cancelled', 'completed'];
export const USER_ROLES = ['admin', 'customer', 'support', 'service_provider'];

let _storeRef = null;
export function injectAdminSectionsStore(store) {
  _storeRef = store;
}

export function loadSavedSection() {
  const saved = (_storeRef && _storeRef.getState()?.ui?.section) || 'dashboard';
  return SECTIONS.some(([id]) => id === saved) ? saved : 'dashboard';
}

export function saveSection(id) {
  if (_storeRef) {
    _storeRef.dispatch(setSection(id));
  }
}
