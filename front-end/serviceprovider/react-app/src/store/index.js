import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fleetReducer from './slices/fleetSlice';
import schedulesReducer from './slices/schedulesSlice';
import bookingsReducer from './slices/bookingsSlice';
import seatsReducer from './slices/seatsSlice';
import couponsReducer from './slices/couponsSlice';
import reviewsReducer from './slices/reviewsSlice';
import lostFoundReducer from './slices/lostFoundSlice';
import escalationsReducer from './slices/escalationsSlice';
import revenueReducer from './slices/revenueSlice';
import notificationsReducer from './slices/notificationsSlice';
import memoryReducer from './slices/memorySlice';
import uiReducer from './slices/uiSlice';
import { injectMemoryBridgeStore } from './memoryBridge';

const rootReducer = combineReducers({
  auth: authReducer,
  fleet: fleetReducer,
  schedules: schedulesReducer,
  bookings: bookingsReducer,
  seats: seatsReducer,
  coupons: couponsReducer,
  reviews: reviewsReducer,
  lostFound: lostFoundReducer,
  escalations: escalationsReducer,
  revenue: revenueReducer,
  notifications: notificationsReducer,
  memory: memoryReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

injectMemoryBridgeStore(store);

export default store;
