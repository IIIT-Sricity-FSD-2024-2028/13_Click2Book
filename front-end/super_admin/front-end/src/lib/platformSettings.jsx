/**
 * Platform settings backed by Redux memory (`platformSettingsSlice`) and synced with the backend.
 */
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiRequest } from './http';
import {
  DEFAULT_PLATFORM_SETTINGS_STATE,
  setPlatformSettings,
} from '../store/slices/platformSettingsSlice';

export const DEFAULT_PLATFORM_SETTINGS = DEFAULT_PLATFORM_SETTINGS_STATE;

let _store = null;

export function injectPlatformSettingsStore(store) {
  _store = store;
}

export function getPlatformSettings() {
  if (_store) return _store.getState().platformSettings.settings;
  return DEFAULT_PLATFORM_SETTINGS;
}

export async function loadPlatformSettings() {
  try {
    const data = await apiRequest('/platform/settings', { role: null });
    if (data && _store) {
      _store.dispatch(setPlatformSettings(data));
    }
  } catch {
    /* keep existing Redux defaults */
  }
  return getPlatformSettings();
}

export function usePlatformSettings() {
  const settings = useSelector((state) => state.platformSettings.settings);

  useEffect(() => {
    if (settings.updatedAt === '1970-01-01T00:00:00.000Z') {
      loadPlatformSettings();
    }
  }, [settings.updatedAt]);

  return settings;
}

/**
 * Customer's cancellation refund breakdown for a booking using the platform rules.
 */
export function refundFor(fare, settings = getPlatformSettings()) {
  const f = Math.max(0, Number(fare) || 0);
  const { refundPercent, cancellationFee } = settings.cancellation;
  const gross = (f * refundPercent) / 100;
  const refund = Math.max(0, Math.round((gross - cancellationFee) * 100) / 100);
  const retained = Math.max(0, Math.round((f - refund) * 100) / 100);
  return { refund, retained, refundPercent, cancellationFee };
}
