import {
  setSection,
  toggleCollapsed,
  setToast,
  setBusy,
  setRefreshing,
  setDataError,
  clearTransientUi,
} from '../slices/uiSlice';
import { clearBookingSearch } from '../slices/bookingsSlice';
import { setRoute } from '../slices/authSlice';

export {
  setSection,
  toggleCollapsed,
  setToast,
  setBusy,
  setRefreshing,
  setDataError,
  clearTransientUi,
};

let _toastTimer = null;
export const showToastThunk = (message) => (dispatch) => {
  if (_toastTimer) clearTimeout(_toastTimer);
  dispatch(setToast(message));
  _toastTimer = setTimeout(() => {
    dispatch(setToast(''));
  }, 2800);
};

export const navigateSectionThunk = (id) => (dispatch) => {
  if (id !== 'bookings') {
    dispatch(clearBookingSearch());
  }
  dispatch(setDataError(''));
  dispatch(setSection(id));
};

export const navigateRouteThunk = (route) => (dispatch) => {
  dispatch(clearTransientUi());
  dispatch(setRoute(route));
  if (typeof window !== 'undefined') {
    window.location.hash = `#${route}`;
  }
};
