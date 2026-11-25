import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'dashboard',
  isNotifOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      const tab = action.payload === 'cost-impact' ? 'dashboard' : action.payload;
      state.activeTab = tab || 'dashboard';
    },
    setNotifOpen: (state, action) => {
      state.isNotifOpen = Boolean(action.payload);
    },
    toggleNotifOpen: (state) => {
      state.isNotifOpen = !state.isNotifOpen;
    },
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearTransientUi: (state) => {
      state.isNotifOpen = false;
    },
  },
});

export const {
  setActiveTab,
  setNotifOpen,
  toggleNotifOpen,
  addToast,
  dismissToast,
  clearTransientUi,
} = uiSlice.actions;

export default uiSlice.reducer;
