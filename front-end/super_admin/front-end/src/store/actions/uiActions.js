import {
  setPanelOpen,
  setCurrentTable,
  setSearchFilter,
  setPanelModal,
  setPendingDelete,
  showPanelToast,
  hidePanelToast,
  setLedgerFilter,
  setTicketFilter,
  setPaymentFilter,
  setRefundFilter,
  setTrendMode,
  setActiveRoute,
} from '../slices/uiSlice';
import { clearAuthErrorsAction } from './authActions';
import { clearPlatformSettingsMessageAction } from './platformSettingsActions';
import { clearRevenueTransient } from './revenueActions';

let toastTimeoutId = null;

export const showPanelToastThunk = (message, type = 'success') => (dispatch) => {
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  dispatch(showPanelToast({ message, type }));
  toastTimeoutId = setTimeout(() => {
    dispatch(hidePanelToast());
  }, 3200);
};

export const navigateAndClearTransientThunk = (pathname) => (dispatch) => {
  dispatch(setActiveRoute(pathname));
  dispatch(clearAuthErrorsAction());
  dispatch(clearPlatformSettingsMessageAction());
  dispatch(clearRevenueTransient());
};

export {
  setPanelOpen,
  setCurrentTable,
  setSearchFilter,
  setPanelModal,
  setPendingDelete,
  hidePanelToast,
  setLedgerFilter,
  setTicketFilter,
  setPaymentFilter,
  setRefundFilter,
  setTrendMode,
  setActiveRoute,
};
