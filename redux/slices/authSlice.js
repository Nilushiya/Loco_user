import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  role: null, // 'User'
  userId: null,
  userInfo: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.userId = action.payload.userId ?? null;
      state.userInfo = action.payload.userInfo ?? null;
      state.isLoading = false;
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.isLoading = false;
      state.error = null;
      state.userId = null;
      state.userInfo = null;
    },
  },
});

export const { startLoading, authSuccess, authFailure, logout } = authSlice.actions;
export default authSlice.reducer; 
