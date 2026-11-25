import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'landing',
  isNotifOpen: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload || 'landing';
    },
    setNotifOpen: (state, action) => {
      state.isNotifOpen = Boolean(action.payload);
    },
    setToast: (state, action) => {
      state.toast = action.payload || null;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    clearTransientUi: (state) => {
      state.isNotifOpen = false;
    },
  },
});

export const {
  setActiveTab,
  setNotifOpen,
  setToast,
  clearToast,
  clearTransientUi,
} = uiSlice.actions;

export default uiSlice.reducer;
