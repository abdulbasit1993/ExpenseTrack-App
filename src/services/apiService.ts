import { BASE_URL } from '../config/apiUrl';
import { getJwtToken } from '../utils/storeToken';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    // React Native AsyncStorage
    // const token = await AsyncStorage.getItem('token');

    // Browser local storage
    // const token = localStorage.getItem('token');

    // React Native Keychain
    const token = await getJwtToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let data;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.message || 'Request failed',
        data,
      };
    }

    return data as T;
  } catch (error) {
    console.error('API Error: ', error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),

  putMultipart: async <T>(
    endpoint: string,
    formData: FormData,
  ): Promise<T> => {
    const token = await getJwtToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Let fetch set the multipart boundary on Content-Type.

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errPayload = (data ?? {}) as { message?: string };
      throw {
        status: response.status,
        message: errPayload.message ?? 'Request failed',
        data,
      };
    }

    return data as T;
  },
};
