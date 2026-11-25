import { apiRequest } from '../../lib/http';
import { revenueRequest } from '../../superadmin/revenueMock';
import {
  DEFAULT_PLATFORM_SETTINGS_STATE,
  createPlatformRule,
  readPlatformSettingsState,
  setPlatformSettings,
  updatePlatformSettingsSection,
  deletePlatformRule,
  resetPlatformSettings,
  setDismissedAnnouncement,
  setPlatformSettingsLoading,
  setPlatformSettingsSaving,
  setPlatformSettingsMessage,
  clearPlatformSettingsTransient,
} from '../slices/platformSettingsSlice';

export const fetchPlatformSettingsThunk = ({ force = false, useRevenueMock = false } = {}) => async (dispatch) => {
  dispatch(setPlatformSettingsLoading(true));
  try {
    const data = useRevenueMock
      ? await revenueRequest('/platform/settings', { role: null })
      : await apiRequest('/platform/settings', { role: null });
    if (data) dispatch(setPlatformSettings(data));
    dispatch(readPlatformSettingsState());
    return { success: true, data };
  } catch (err) {
    if (useRevenueMock) {
      dispatch(setPlatformSettingsMessage({ text: 'Could not load the platform settings: ' + err.message, ok: false }));
    }
    return { success: false, error: err?.message || 'Failed to load settings' };
  } finally {
    dispatch(setPlatformSettingsLoading(false));
  }
};

export const savePlatformSettingsThunk = (patch, doneMessage = 'Fees and refund rules saved.') => async (dispatch) => {
  dispatch(setPlatformSettingsSaving(true));
  dispatch(setPlatformSettingsMessage(null));
  try {
    const saved = await revenueRequest('/platform/settings', {
      role: 'ADMIN',
      method: 'PUT',
      body: patch,
      headers: { 'x-admin-email': 'Super Admin' },
    });
    dispatch(setPlatformSettings(saved));
    dispatch(setPlatformSettingsMessage({ text: doneMessage, ok: true }));
    return { success: true, data: saved };
  } catch (err) {
    const text = 'Failed to save: ' + (err?.message || 'Unknown error');
    dispatch(setPlatformSettingsMessage({ text, ok: false }));
    return { success: false, error: text };
  } finally {
    dispatch(setPlatformSettingsSaving(false));
  }
};

export const restorePlatformDefaultsThunk = () => async (dispatch) => {
  const defaultPatch = {
    fees: { ...DEFAULT_PLATFORM_SETTINGS_STATE.fees },
    cancellation: { ...DEFAULT_PLATFORM_SETTINGS_STATE.cancellation },
  };
  return dispatch(savePlatformSettingsThunk(defaultPatch, 'Fees and refund rules restored to defaults.'));
};

export const dismissAnnouncementAction = (announcement) => (dispatch) => {
  dispatch(setDismissedAnnouncement(announcement || ''));
};

export const clearPlatformSettingsMessageAction = () => (dispatch) => {
  dispatch(clearPlatformSettingsTransient());
};

export {
  createPlatformRule,
  updatePlatformSettingsSection,
  deletePlatformRule,
  resetPlatformSettings,
  setPlatformSettingsMessage,
};
