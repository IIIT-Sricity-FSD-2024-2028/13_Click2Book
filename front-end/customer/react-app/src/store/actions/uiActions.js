import { setActiveTab, setNotifOpen, setToast, clearToast, clearTransientUi } from '../slices/uiSlice';
import { setLoginModal, setRedirectAfterLogin } from '../slices/authSlice';
import { clearSearchTransient } from '../slices/tripsSlice';
import {
  setSelectedBookingForCancel,
  clearBookingTransient,
} from '../slices/bookingsSlice';
import {
  setSelectedBookingForRefund,
  clearRefundSelection,
} from '../slices/refundsSlice';

export { setActiveTab, setNotifOpen, setToast, clearToast, clearTransientUi };

const PROTECTED_TABS = ['my-bookings', 'cancel-ticket', 'my-profile', 'get-support'];

export const showToastThunk = (message, type = 'info') => (dispatch) => {
  dispatch(setToast({ id: Date.now() + Math.random(), message, type }));
};

export const navigateTabThunk = (tab, params = {}) => (dispatch, getState) => {
  const user = getState().auth.user;
  if (PROTECTED_TABS.includes(tab) && (!user || !user.isLoggedIn)) {
    const msg =
      tab === 'get-support'
        ? 'Please sign in to access customer support.'
        : 'Please sign in to access your account.';
    dispatch(showToastThunk(msg, 'info'));
    dispatch(setRedirectAfterLogin(`#${tab}`));
    dispatch(
      setLoginModal({
        isOpen: true,
        initialPanel: 'login',
        promptMessage: msg,
        redirectAfterLogin: `#${tab}`,
      })
    );
    return;
  }

  // Clear transient navigation selections when leaving views without dropping shared repository data
  if (tab !== 'cancel-ticket') dispatch(clearBookingTransient());
  if (tab !== 'track-refunds') dispatch(clearRefundSelection());
  if (tab !== 'search-trips') dispatch(clearSearchTransient());
  dispatch(clearTransientUi());

  if (params.booking) {
    dispatch(setSelectedBookingForCancel(params.booking));
  }
  if (params.bookingId) {
    dispatch(setSelectedBookingForRefund(params.bookingId));
  }
  dispatch(setActiveTab(tab));
  if (typeof window !== 'undefined') {
    window.location.hash = tab === 'landing' ? '' : `#${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
