import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookingsReducer from './slices/bookingsSlice';
import refundsReducer from './slices/refundsSlice';
import usersReducer from './slices/usersSlice';
import routesReducer from './slices/routesSlice';
import locationsReducer from './slices/locationsSlice';
import couponsReducer from './slices/couponsSlice';
import reportsReducer from './slices/reportsSlice';
import tablesReducer from './slices/tablesSlice';
import uiReducer from './slices/uiSlice';
import { injectAdminSessionStore } from '../lib/session.js';
import { injectAdminApiStore } from '../lib/api.js';
import { injectAdminSectionsStore } from '../data/sections.js';
import { injectAdminDataStore } from '../data/store.js';
import { injectAdminRemoteStore } from '../lib/remote.js';

const rootReducer = combineReducers({
  auth: authReducer,
  bookings: bookingsReducer,
  refunds: refundsReducer,
  users: usersReducer,
  routes: routesReducer,
  locations: locationsReducer,
  coupons: couponsReducer,
  reports: reportsReducer,
  tables: tablesReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

injectAdminSessionStore(store);
injectAdminApiStore(store);
injectAdminSectionsStore(store);
injectAdminDataStore(store);
injectAdminRemoteStore(store);

export default store;
