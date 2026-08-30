import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
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

export type UserPreferences = {
  monthlyBudget: number;
  currency: string;
};

type GetCurrentUserResponse = {
  success: boolean;
  data: {
    user: User;
  };
};

type UpdatePreferencesResponse = {
  success: boolean;
  message?: string;
  data?: { user: User };
};

type UpdateProfileResponse = {
  success: boolean;
  message?: string;
  data?: { user: User };
};

type AssetLikeInput = {
  uri?: string;
  type?: string;
  name?: string;
  fileName?: string;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: AssetLikeInput;
  removeProfileImage?: boolean;
};

type UserState = {
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  preferencesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  preferencesError: string | null;
  profileStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  profileError: string | null;
};

const initialState: UserState = {
  user: null,
  status: 'idle',
  error: null,
  preferencesStatus: 'idle',
  preferencesError: null,
  profileStatus: 'idle',
  profileError: null,
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

export const updateUserPreferences = createAsyncThunk<
  User,
  Partial<UserPreferences>
>('user/updateUserPreferences', async (payload, { getState }) => {
  const response = await api.patch<UpdatePreferencesResponse>(
    '/user/preferences',
    payload,
  );

  if (!response.success) {
    throw new Error(response.message ?? 'Unable to update preferences.');
  }

  if (response.data?.user) {
    return response.data.user;
  }

  const state = getState() as { user: { user: User | null } };
  const current = state.user.user;

  if (!current) {
    throw new Error('Unable to update preferences: No active user.');
  }

  return {
    ...current,
    ...(payload.monthlyBudget !== undefined && {
      monthlyBudget: payload.monthlyBudget,
    }),
    ...(payload.currency !== undefined && { currency: payload.currency }),
  };
});

export const updateUserProfile = createAsyncThunk<
  User,
  UpdateProfilePayload
>('user/updateUserProfile', async (payload, { getState }) => {
  const formData = new FormData();
  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);
  formData.append('email', payload.email);

  if (payload.removeProfileImage) {
    formData.append('removeProfileImage', 'true');
  } else if (payload.profileImage?.uri) {
    const asset = payload.profileImage;
    formData.append('profileImage', {
      uri: asset.uri,
      type: asset.type ?? 'image/jpeg',
      name: asset.name ?? asset.fileName ?? 'profile.jpg',
    });
  }

  const response = await api.putMultipart<UpdateProfileResponse>(
    '/user/profile',
    formData,
  );

  if (!response.success) {
    throw new Error(response.message ?? 'Unable to update your profile.');
  }

  if (response.data?.user) {
    return response.data.user;
  }

  const state = getState() as { user: { user: User | null } };
  const current = state.user.user;

  if (!current) {
    throw new Error('Unable to update your profile: No active user.');
  }

  return {
    ...current,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
  };
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: state => {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.preferencesStatus = 'idle';
      state.preferencesError = null;
      state.profileStatus = 'idle';
      state.profileError = null;
    },
    setUserPreferences: (state, action: PayloadAction<UserPreferences>) => {
      if (state.user) {
        state.user.monthlyBudget = action.payload.monthlyBudget;
        state.user.currency = action.payload.currency;
      }
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
      })
      .addCase(updateUserPreferences.pending, state => {
        state.preferencesStatus = 'loading';
        state.preferencesError = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.preferencesStatus = 'succeeded';
        state.preferencesError = null;
        state.user = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.preferencesStatus = 'failed';
        state.preferencesError =
          action.error.message ?? 'Unable to update preferences.';
      })
      .addCase(updateUserProfile.pending, state => {
        state.profileStatus = 'loading';
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.profileError = null;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileStatus = 'failed';
        state.profileError =
          action.error.message ?? 'Unable to update your profile.';
      });
  },
});

export const { clearUser, setUserPreferences } = userSlice.actions;
export default userSlice.reducer;
