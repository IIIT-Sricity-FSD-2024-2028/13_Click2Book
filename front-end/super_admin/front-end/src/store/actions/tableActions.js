import DB from '../../lib/db';
import { isRemoteTable, pullAll, remoteDelete, remoteSave } from '../../lib/db/remote';
import {
  createTableRecord,
  readTables,
  updateTableRecord,
  deleteTableRecord,
  resetAllTables,
  setSyncStatus,
  bumpTableVersion,
  setTablesSaving,
  setTablesError,
} from '../slices/tablesSlice';

export const pullAllTablesThunk = () => async (dispatch) => {
  const result = await pullAll();
  dispatch(
    setSyncStatus({
      state: result.offline ? 'offline' : result.ok ? 'live' : 'partial',
      at: Date.now(),
      failed: result.failed || [],
    }),
  );
  dispatch(readTables());
  return result;
};

export const createTableRecordThunk = (dbKey, formData) => async (dispatch) => {
  if (isRemoteTable(dbKey)) {
    dispatch(setTablesSaving(true));
    const result = await remoteSave(dbKey, null, formData, null);
    dispatch(setTablesSaving(false));
    if (result.success) dispatch(bumpTableVersion());
    else dispatch(setTablesError(result.error));
    return result;
  }
  const result = DB[dbKey].create(formData);
  if (!result.success) {
    dispatch(setTablesError(result.error));
  } else {
    dispatch(readTables());
  }
  return result;
};

export const readTableRecordsAction = () => (dispatch) => {
  dispatch(readTables());
};

export const updateTableRecordThunk = (dbKey, pk, formData, prevRecord) => async (dispatch) => {
  if (isRemoteTable(dbKey)) {
    dispatch(setTablesSaving(true));
    const result = await remoteSave(dbKey, pk, formData, prevRecord);
    dispatch(setTablesSaving(false));
    if (result.success) dispatch(bumpTableVersion());
    else dispatch(setTablesError(result.error));
    return result;
  }
  let result = DB[dbKey].update(pk, formData);
  if (!result.success && !isNaN(Number(pk))) {
    result = DB[dbKey].update(Number(pk), formData);
  }
  if (!result.success) {
    dispatch(setTablesError(result.error));
  } else {
    dispatch(readTables());
  }
  return result;
};

export const deleteTableRecordThunk = (dbKey, pkValue) => async (dispatch) => {
  if (isRemoteTable(dbKey)) {
    dispatch(setTablesSaving(true));
    const result = await remoteDelete(dbKey, pkValue);
    dispatch(setTablesSaving(false));
    if (result.success) dispatch(bumpTableVersion());
    else dispatch(setTablesError(result.error));
    return result;
  }
  const result = DB[dbKey].delete(pkValue);
  if (!result.success) {
    dispatch(setTablesError(result.error));
  } else {
    dispatch(readTables());
  }
  return result;
};

export const resetAllTablesThunk = (isRemote) => async (dispatch) => {
  if (isRemote) {
    const r = await dispatch(pullAllTablesThunk());
    return {
      success: !r.offline,
      remote: true,
      offline: r.offline,
      message: r.offline
        ? 'Backend offline — showing cached data.'
        : 'Reloaded all tables from the backend.',
    };
  }
  dispatch(resetAllTables());
  return { success: true, remote: false, message: 'Database reset to mock data.' };
};

export { createTableRecord, updateTableRecord, deleteTableRecord };
