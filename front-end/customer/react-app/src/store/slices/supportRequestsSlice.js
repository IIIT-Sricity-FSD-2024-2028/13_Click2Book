import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const supportRequestsSlice = createSlice({
  name: 'supportRequests',
  initialState,
  reducers: {
    // CREATE
    createSupportRequest: (state, action) => {
      const req = action.payload;
      if (!req) return;
      const id = req.requestId || req.request_id || req.id;
      state.items = [
        req,
        ...state.items.filter((r) => (r.requestId || r.request_id || r.id) !== id),
      ];
    },
    // READ / set
    readSupportRequests: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateSupportRequest: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      const id = updated.requestId || updated.request_id || updated.id;
      const idx = state.items.findIndex((r) => (r.requestId || r.request_id || r.id) === id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteSupportRequest: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((r) => (r.requestId || r.request_id || r.id) !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'supportRequests/fetchSupportRequests/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type === 'supportRequests/submitSupportRequest/fulfilled',
        (state, action) => {
          if (action.payload) {
            const id = action.payload.requestId || action.payload.id;
            state.items = [
              action.payload,
              ...state.items.filter((r) => (r.requestId || r.request_id || r.id) !== id),
            ];
          }
        }
      );
  },
});

export const {
  createSupportRequest,
  readSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
} = supportRequestsSlice.actions;

export default supportRequestsSlice.reducer;
