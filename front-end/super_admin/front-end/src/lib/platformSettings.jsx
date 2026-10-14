/**
 * Platform settings set by the Super Admin (GET /platform/settings).
 *
 * Fetched once at start-up and again on every page change, so a change
 * made in the admin console reaches other portals on their next navigation.
 * Offline, the defaults below (the same as the backend's) apply.
 */
import { useEffect, useState } from 'react';
import { apiRequest } from './http';

export const DEFAULT_PLATFORM_SETTINGS = {
  booking: { maxSeatsPerBooking: 4, bookingWindowDays: 60, allowGuestSearch: true },
  cancellation: { allowCancellation: true, cancellationFee: 50, refundPercent: 100 },
  fees: { convenienceFee: 25, gstPercent: 18 },
  notifications: { announcement: '', announcementLevel: 'info', audience: 'ALL' },
  security: {
    maintenanceMode: false,
    allowCustomerRegistration: true,
    allowProviderRegistration: true,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
  },
};

const merge = (base, over) =>
  Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, v && typeof v === 'object' ? { ...v, ...(over?.[k] || {}) } : (over?.[k] ?? v)]),
  );

let current = DEFAULT_PLATFORM_SETTINGS;
let pending = null;
const listeners = new Set();

export const getPlatformSettings = () => current;

/** Call `fn` now and whenever the settings change. Returns an unsubscribe function. */
export function onPlatformSettings(fn) {
  listeners.add(fn);
  fn(current);
  return () => listeners.delete(fn);
}

export function loadPlatformSettings(force = false) {
  if (pending && !force) return pending;
  pending = apiRequest('/platform/settings', { role: null })
    .then((s) => {
      const next = merge(DEFAULT_PLATFORM_SETTINGS, s);
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        current = next;
        listeners.forEach((fn) => fn(current));
      }
      return current;
    })
    .catch(() => current);
  return pending;
}

/** Settings as React state: re-renders when they change. */
export function usePlatformSettings() {
  const [s, setS] = useState(current);
  useEffect(() => {
    const off = onPlatformSettings(setS);
    loadPlatformSettings();
    return off;
  }, []);
  return s;
}

/** Refund for a cancelled ticket under the current rules. */
export function refundFor(fare, s = current) {
  return Math.max(0, Math.round((Number(fare) * s.cancellation.refundPercent) / 100 - s.cancellation.cancellationFee));
}
