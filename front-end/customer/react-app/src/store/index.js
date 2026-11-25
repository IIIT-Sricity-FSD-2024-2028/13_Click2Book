import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tripsReducer from './slices/tripsSlice';
import bookingsReducer from './slices/bookingsSlice';
import refundsReducer from './slices/refundsSlice';
import reviewsReducer from './slices/reviewsSlice';
import supportRequestsReducer from './slices/supportRequestsSlice';
import lostFoundReducer from './slices/lostFoundSlice';
import offersReducer from './slices/offersSlice';
import notificationsReducer from './slices/notificationsSlice';
import uiReducer from './slices/uiSlice';
import { injectCustomerApiStore } from '../services/api';
import { injectCustomerLiveSyncStore } from '../services/liveSync';

const rootReducer = combineReducers({
  auth: authReducer,
  trips: tripsReducer,
  bookings: bookingsReducer,
  refunds: refundsReducer,
  reviews: reviewsReducer,
  supportRequests: supportRequestsReducer,
  lostFound: lostFoundReducer,
  offers: offersReducer,
  notifications: notificationsReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

injectCustomerApiStore(store);
injectCustomerLiveSyncStore(store);

export default store;
