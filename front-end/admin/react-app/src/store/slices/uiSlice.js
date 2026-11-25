import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  section: 'dashboard',
  collapsed: false,
  toast: '',
  busy: false,
  refreshing: false,
  dataError: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSection: (state, action) => {
      state.section = action.payload || 'dashboard';
    },
    toggleCollapsed: (state) => {
      state.collapsed = !state.collapsed;
    },
    setToast: (state, action) => {
      state.toast = action.payload || '';
    },
    setBusy: (state, action) => {
      state.busy = Boolean(action.payload);
    },
    setRefreshing: (state, action) => {
      state.refreshing = Boolean(action.payload);
    },
    setDataError: (state, action) => {
      state.dataError = action.payload || '';
    },
    clearTransientUi: (state) => {
      state.dataError = '';
      state.toast = '';
    },
  },
});

export const {
  setSection,
  toggleCollapsed,
  setToast,
  setBusy,
  setRefreshing,
  setDataError,
  clearTransientUi,
} = uiSlice.actions;

export default uiSlice.reducer;
