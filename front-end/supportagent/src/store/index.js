import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketsReducer from './slices/ticketsSlice';
import customersReducer from './slices/customersSlice';
import refundsReducer from './slices/refundsSlice';
import escalationsReducer from './slices/escalationsSlice';
import notificationsReducer from './slices/notificationsSlice';
import uiReducer from './slices/uiSlice';
import { injectApiStore } from '../services/api';

const rootReducer = combineReducers({
  auth: authReducer,
  tickets: ticketsReducer,
  customers: customersReducer,
  refunds: refundsReducer,
  escalations: escalationsReducer,
  notifications: notificationsReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

injectApiStore(store);

export default store;
