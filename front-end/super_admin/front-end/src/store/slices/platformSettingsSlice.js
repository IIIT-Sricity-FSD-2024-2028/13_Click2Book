import { createSlice } from '@reduxjs/toolkit';

export const DEFAULT_PLATFORM_SETTINGS_STATE = {
  fees: { convenienceFee: 25, gstPercent: 5 },
  cancellation: { refundPercent: 80, cancellationFee: 50 },
  bookings: { maxSeatsPerBooking: 6, bookingWindowDays: 30, supportEmail: 'support@click2book.in' },
  security: { sessionTimeoutMinutes: 30, minPasswordLength: 6, maintenanceMode: false },
  notifications: { announcement: '', announcementLevel: 'info', audience: 'ALL' },
  updatedAt: '1970-01-01T00:00:00.000Z',
  updatedBy: '',
};

const mergeSettings = (data = {}) => ({
  fees: { ...DEFAULT_PLATFORM_SETTINGS_STATE.fees, ...data.fees },
  cancellation: { ...DEFAULT_PLATFORM_SETTINGS_STATE.cancellation, ...data.cancellation },
  bookings: { ...DEFAULT_PLATFORM_SETTINGS_STATE.bookings, ...data.bookings },
  security: { ...DEFAULT_PLATFORM_SETTINGS_STATE.security, ...data.security },
  notifications: { ...DEFAULT_PLATFORM_SETTINGS_STATE.notifications, ...data.notifications },
  updatedAt: data.updatedAt || DEFAULT_PLATFORM_SETTINGS_STATE.updatedAt,
  updatedBy: data.updatedBy || DEFAULT_PLATFORM_SETTINGS_STATE.updatedBy,
});

const initialState = {
  settings: mergeSettings(),
  dismissedAnnouncement: '',
  loading: false,
  saving: false,
  message: null,
};

const platformSettingsSlice = createSlice({
  name: 'platformSettings',
  initialState,
  reducers: {
    // CREATE
    createPlatformRule: (state, action) => {
      const { section, key, value } = action.payload || {};
      if (section && key && state.settings[section]) {
        state.settings[section][key] = value;
      }
    },
    // READ
    readPlatformSettingsState: (state) => state,
    // UPDATE
    setPlatformSettings: (state, action) => {
      state.settings = mergeSettings(action.payload || {});
    },
    updatePlatformSettingsSection: (state, action) => {
      state.settings = mergeSettings({
        ...state.settings,
        ...(action.payload || {}),
      });
    },
    // DELETE / reset
    deletePlatformRule: (state, action) => {
      const { section, key } = action.payload || {};
      if (section && key && DEFAULT_PLATFORM_SETTINGS_STATE[section]) {
        state.settings[section][key] = DEFAULT_PLATFORM_SETTINGS_STATE[section][key];
      }
    },
    resetPlatformSettings: (state) => {
      state.settings = mergeSettings();
      state.message = null;
    },
    setDismissedAnnouncement: (state, action) => {
      state.dismissedAnnouncement = action.payload || '';
    },
    setPlatformSettingsLoading: (state, action) => {
      state.loading = Boolean(action.payload);
    },
    setPlatformSettingsSaving: (state, action) => {
      state.saving = Boolean(action.payload);
    },
    setPlatformSettingsMessage: (state, action) => {
      state.message = action.payload || null;
    },
    clearPlatformSettingsTransient: (state) => {
      state.message = null;
      state.loading = false;
      state.saving = false;
    },
  },
});

export const {
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
} = platformSettingsSlice.actions;

export default platformSettingsSlice.reducer;
