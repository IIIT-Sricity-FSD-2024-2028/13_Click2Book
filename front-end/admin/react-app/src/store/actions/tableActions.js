import { createAsyncThunk } from '@reduxjs/toolkit';
import { pullAll } from '../../lib/remote.js';
import {
  createTableRecord,
  replaceTableRecords,
  updateTableRecord,
  deleteTableRecord,
  resetAllTables,
} from '../slices/tablesSlice';

export {
  createTableRecord,
  replaceTableRecords,
  updateTableRecord,
  deleteTableRecord,
  resetAllTables,
};

export const pullAllTablesThunk = createAsyncThunk(
  'tables/pullAll',
  async () => pullAll()
);
