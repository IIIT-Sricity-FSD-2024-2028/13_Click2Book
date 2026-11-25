import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // CREATE
    createUser: (state, action) => {
      if (action.payload) state.items.unshift(action.payload);
    },
    // READ
    readUsers: (state, action) => {
      if (Array.isArray(action.payload)) state.items = action.payload;
    },
    // UPDATE
    updateUser: (state, action) => {
      const updated = action.payload;
      if (!updated?.id) return;
      const idx = state.items.findIndex((u) => u.id === updated.id);
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
    },
    // DELETE
    deleteUser: (state, action) => {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
  },
});

export const { createUser, readUsers, updateUser, deleteUser } = usersSlice.actions;
export default usersSlice.reducer;
