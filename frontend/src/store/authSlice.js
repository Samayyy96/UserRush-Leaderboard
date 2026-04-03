import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,    // will store displayName, email, photoURL, uid
  loading: true, // initially true until Firebase resolves auth state
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.error = null;
      state.loading = false;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.error = null;
      state.loading = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, loginSuccess, logoutSuccess, setError } = authSlice.actions;

export default authSlice.reducer;
