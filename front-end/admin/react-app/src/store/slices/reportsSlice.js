import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dashboardMetrics: {
    bookings: [],
    refunds: [],
    users: [],
    routes: [],
    revenueByDay: [],
    totalRevenue: 0,
    activeBuses: 0,
  },
  revenueData: {
    bookings: [],
    refunds: [],
    totalRevenue: 0,
    grossRevenue: 0,
    totalRefunds: 0,
  },
  hasLoadedRevenue: false,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    // CREATE
    createReportEntry: (state, action) => {
      if (action.payload) {
        state.dashboardMetrics.revenueByDay.push(action.payload);
      }
    },
    // READ
    readReports: (state, action) => {
      if (action.payload) {
        state.dashboardMetrics = action.payload;
      }
    },
    // UPDATE
    updateReportMetrics: (state, action) => {
      if (action.payload) {
        state.revenueData = { ...state.revenueData, ...action.payload };
        state.hasLoadedRevenue = true;
      }
    },
    // DELETE
    deleteReportEntry: (state, action) => {
      state.dashboardMetrics.revenueByDay = state.dashboardMetrics.revenueByDay.filter(
        (d) => d.date !== action.payload
      );
    },
  },
});

export const {
  createReportEntry,
  readReports,
  updateReportMetrics,
  deleteReportEntry,
} = reportsSlice.actions;

export default reportsSlice.reducer;
