import {
  setActiveTab,
  setNotifOpen,
  toggleNotifOpen,
  addToast,
  dismissToast,
  clearTransientUi,
} from '../slices/uiSlice';
import { clearTicketSelections } from '../slices/ticketsSlice';
import { clearCustomerSelection } from '../slices/customersSlice';

export {
  setActiveTab,
  setNotifOpen,
  toggleNotifOpen,
  addToast,
  dismissToast,
  clearTransientUi,
};

export const showToastThunk = (message, type = 'info') => (dispatch) => {
  const id = Date.now() + Math.random().toString(36).slice(2, 6);
  dispatch(addToast({ id, message, type }));
  setTimeout(() => {
    dispatch(dismissToast(id));
  }, 4000);
};

export const navigateTabThunk = (tabId) => (dispatch) => {
  const valid = tabId === 'cost-impact' ? 'dashboard' : tabId;
  dispatch(clearTicketSelections());
  dispatch(clearCustomerSelection());
  dispatch(clearTransientUi());
  dispatch(setActiveTab(valid));
  if (typeof window !== 'undefined') {
    window.location.hash = valid;
  }
};
