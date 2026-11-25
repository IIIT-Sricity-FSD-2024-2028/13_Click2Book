import { createAsyncThunk } from '@reduxjs/toolkit';
import { getCustomers } from '../../services/api';
import {
  createCustomer,
  readCustomers,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomerId,
  clearCustomerSelection,
} from '../slices/customersSlice';

export {
  createCustomer,
  readCustomers,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomerId,
  clearCustomerSelection,
};

export const fetchCustomersThunk = createAsyncThunk(
  'customers/fetchCustomers',
  async () => getCustomers()
);

export const createCustomerThunk = createAsyncThunk(
  'customers/createCustomer',
  async (customerData) => ({
    id: customerData.id || `C-${Date.now().toString().slice(-4)}`,
    ...customerData,
  })
);

export const updateCustomerThunk = createAsyncThunk(
  'customers/updateCustomer',
  async (customerData) => customerData
);

export const deleteCustomerThunk = createAsyncThunk(
  'customers/deleteCustomer',
  async (customerId) => customerId
);
