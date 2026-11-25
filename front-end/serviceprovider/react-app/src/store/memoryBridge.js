import {
  createMemoryEntry,
  updateMemoryEntry,
  deleteMemoryEntry,
  clearMemoryEntries,
} from './slices/memorySlice';

let _storeRef = null;
const _fallbackMemory = new Map();

export function injectMemoryBridgeStore(store) {
  _storeRef = store;
}

export const memStorage = {
  getItem(key) {
    if (_storeRef) {
      const entries = _storeRef.getState()?.memory?.entries;
      if (entries && Object.prototype.hasOwnProperty.call(entries, key)) {
        return entries[key];
      }
    }
    return _fallbackMemory.has(key) ? _fallbackMemory.get(key) : null;
  },
  setItem(key, value) {
    const str = String(value);
    _fallbackMemory.set(key, str);
    if (_storeRef) {
      const entries = _storeRef.getState()?.memory?.entries;
      if (entries && Object.prototype.hasOwnProperty.call(entries, key)) {
        _storeRef.dispatch(updateMemoryEntry({ key, value: str }));
      } else {
        _storeRef.dispatch(createMemoryEntry({ key, value: str }));
      }
    }
  },
  removeItem(key) {
    _fallbackMemory.delete(key);
    if (_storeRef) {
      _storeRef.dispatch(deleteMemoryEntry(key));
    }
  },
  clear() {
    _fallbackMemory.clear();
    if (_storeRef) {
      _storeRef.dispatch(clearMemoryEntries());
    }
  },
};

export function getAuthFromStore() {
  return _storeRef ? _storeRef.getState()?.auth : null;
}
