import {
  setActiveTab,
  setNotifOpen,
  toggleNotifOpen,
  addToast,
  dismissToast,
  clearTransientUi,
} from '../slices/uiSlice';

export {
  setActiveTab,
  setNotifOpen,
  toggleNotifOpen,
  addToast,
  dismissToast,
  clearTransientUi,
};

const VALID_TABS = [
  'dashboard',
  'fleet-management',
  'manage-schedules',
  'confirm-trips',
  'seat-management',
  'coupons',
  'reviews',
  'lost-found',
  'revenue',
  'settings',
  'escalations',
];

export const showToastThunk = (message, type = 'info') => (dispatch) => {
  const id = Date.now() + Math.random();
  dispatch(addToast({ id, message, type }));
  setTimeout(() => {
    dispatch(dismissToast(id));
  }, 4000);
};

export const navigateTabThunk = (tab) => (dispatch) => {
  const target = tab === 'add-schedule' ? 'fleet-management' : tab;
  if (!VALID_TABS.includes(target)) return;
  dispatch(clearTransientUi());
  dispatch(setActiveTab(target));
  if (typeof window !== 'undefined') {
    window.location.hash = target;
  }
};
