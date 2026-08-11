import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../services/apiService';

export type Category = {
  _id: string;
  name: string;
  type?: string;
  icon?: string;
  color?: string;
  [key: string]: unknown;
};

type CategoriesResponse = {
  success: boolean;
  data?: Category[] | { categories?: Category[] };
  categories?: Category[];
};

type CategoriesState = {
  categories: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: CategoriesState = {
  categories: [],
  status: 'idle',
  error: null,
};

export const fetchCategories = createAsyncThunk<Category[]>(
  'categories/fetchCategories',
  async () => {
    const response = await api.get<CategoriesResponse>('/categories');

    if (!response.success) {
      throw new Error('Unable to retrieve categories.');
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && Array.isArray(response.data.categories)) {
      return response.data.categories;
    }

    if (Array.isArray(response.categories)) {
      return response.categories;
    }

    return [];
  },
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories: state => {
      state.categories = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCategories.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to retrieve categories.';
      });
  },
});

export const { clearCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;
