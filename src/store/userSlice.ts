import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../services/apiService';

export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  monthlyBudget: number;
  currency: string;
  profileImage: string;
  createdAt: string;
  updatedAt: string;
};

type GetCurrentUserResponse = {
  success: boolean;
  data: {
    user: User;
  };
};

type UserState = {
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: UserState = {
  user: null,
  status: 'idle',
  error: null,
};

export const fetchCurrentUser = createAsyncThunk<User>(
  'user/fetchCurrentUser',
  async () => {
    const response = await api.get<GetCurrentUserResponse>('/auth/me');

    if (!response.success || !response.data?.user) {
      throw new Error('Unable to retrieve user data.');
    }

    return response.data.user;
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: state => {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCurrentUser.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to retrieve user data.';
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer;
