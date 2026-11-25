import { createSlice } from '@reduxjs/toolkit';
import { INITIAL_CUSTOMERS } from '../../services/mockData';

const initialState = {
  items: INITIAL_CUSTOMERS,
  selectedCustomerId: null,
  loading: false,
  error: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // CREATE
    createCustomer: (state, action) => {
      const customer = action.payload;
      if (customer && !state.items.some((c) => c.id === customer.id)) {
        state.items.unshift(customer);
      }
    },
    // READ / set
    readCustomers: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      }
    },
    // UPDATE
    updateCustomer: (state, action) => {
      const updated = action.payload;
      if (!updated?.id) return;
      const idx = state.items.findIndex((c) => c.id === updated.id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteCustomer: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((c) => c.id !== id);
      if (state.selectedCustomerId === id) state.selectedCustomerId = null;
    },
    setSelectedCustomerId: (state, action) => {
      state.selectedCustomerId = action.payload || null;
    },
    clearCustomerSelection: (state) => {
      state.selectedCustomerId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type === 'customers/fetchCustomers/fulfilled',
        (state, action) => {
          state.loading = false;
          if (Array.isArray(action.payload)) state.items = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type === 'customers/createCustomer/fulfilled',
        (state, action) => {
          if (action.payload) state.items.unshift(action.payload);
        }
      )
      .addMatcher(
        (action) => action.type === 'customers/updateCustomer/fulfilled',
        (state, action) => {
          const updated = action.payload;
          if (!updated?.id) return;
          const idx = state.items.findIndex((c) => c.id === updated.id);
          if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
        }
      )
      .addMatcher(
        (action) => action.type === 'customers/deleteCustomer/fulfilled',
        (state, action) => {
          state.items = state.items.filter((c) => c.id !== action.payload);
        }
      );
  },
});

export const {
  createCustomer,
  readCustomers,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomerId,
  clearCustomerSelection,
} = customersSlice.actions;

export default customersSlice.reducer;
