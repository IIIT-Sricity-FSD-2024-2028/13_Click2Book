import { createSlice } from '@reduxjs/toolkit';
import { SEED } from '../../data/mockData.js';

const initialState = {
  data: Object.fromEntries(
    Object.entries(SEED).map(([key, rows]) => [key, Array.isArray(rows) ? [...rows] : []])
  ),
};

const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    // CREATE
    createTableRecord: (state, action) => {
      const { tableKey, record } = action.payload || {};
      if (!tableKey || !record) return;
      if (!Array.isArray(state.data[tableKey])) state.data[tableKey] = [];
      state.data[tableKey].push({ ...record });
    },
    // READ / replace whole table
    replaceTableRecords: (state, action) => {
      const { tableKey, rows } = action.payload || {};
      if (tableKey && Array.isArray(rows)) {
        state.data[tableKey] = rows;
      }
    },
    // UPDATE
    updateTableRecord: (state, action) => {
      const { tableKey, pkField, id, changes } = action.payload || {};
      const list = state.data[tableKey];
      if (!Array.isArray(list)) return;
      const idx = list.findIndex((row) => row[pkField] === id);
      if (idx >= 0) {
        const { [pkField]: _ignored, ...safeChanges } = changes || {};
        list[idx] = { ...list[idx], ...safeChanges };
      }
    },
    // DELETE
    deleteTableRecord: (state, action) => {
      const { tableKey, pkField, id } = action.payload || {};
      const list = state.data[tableKey];
      if (!Array.isArray(list)) return;
      state.data[tableKey] = list.filter((row) => row[pkField] !== id);
    },
    resetAllTables: (state) => {
      state.data = Object.fromEntries(
        Object.entries(SEED).map(([key, rows]) => [key, Array.isArray(rows) ? [...rows] : []])
      );
    },
  },
});

export const {
  createTableRecord,
  replaceTableRecords,
  updateTableRecord,
  deleteTableRecord,
  resetAllTables,
} = tablesSlice.actions;

export default tablesSlice.reducer;
