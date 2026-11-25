import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tablesReducer from './slices/tablesSlice';
import platformSettingsReducer from './slices/platformSettingsSlice';
import revenueReducer from './slices/revenueSlice';
import uiReducer from './slices/uiSlice';
import { injectSessionStore } from '../lib/session';
import { injectDbStore } from '../lib/db';
import { injectPlatformSettingsStore } from '../lib/platformSettings';
import { injectRevenueMockStore } from '../superadmin/revenueMock';

const rootReducer = combineReducers({
  auth: authReducer,
  tables: tablesReducer,
  platformSettings: platformSettingsReducer,
  revenue: revenueReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

injectSessionStore(store);
injectDbStore(store);
injectPlatformSettingsStore(store);
injectRevenueMockStore(store);

export default store;
