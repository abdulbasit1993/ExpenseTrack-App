import { BASE_URL } from '../config/apiUrl';
import {
  getRefreshToken,
  removeRefreshToken,
  storeRefreshToken,
} from '../utils/storeToken';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipRefresh?: boolean;
};

type RefreshResponse = {
  data: {
    accessToken: string;
    refreshToken?: string;
  };
};

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function clearAuthTokens() {
  accessToken = null;
  await removeRefreshToken();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    console.log('response (/auth/refresh): ', response);

    if (!response.ok) {
      await clearAuthTokens();
      return null;
    }

    const data = (await response.json()) as RefreshResponse;

    if (!data?.data.accessToken) {
      await clearAuthTokens();
      return null;
    }

    setAccessToken(data?.data.accessToken);

    // Save the replacement only when the backend rotates refresh tokens.
    if (data?.data?.refreshToken) {
      await storeRefreshToken(data?.data?.refreshToken);
    }

    return data?.data?.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function sendRequest(
  endpoint: string,
  options: RequestOptions,
  token: string | null,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await sendRequest(endpoint, options, accessToken);

  if (response.status === 401 && !options.skipRefresh) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await sendRequest(endpoint, options, refreshedToken);
    }
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as { message?: string } | null;

    throw {
      status: response.status,
      message: errorData?.message ?? 'Request failed',
      data,
    };
  }

  return data as T;
}

async function putMultipart<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const send = (token: string | null) => {
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
  };

  let response = await send(accessToken);

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await send(refreshedToken);
    }
  }

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as { message?: string } | null;

    throw {
      status: response.status,
      message: errorData?.message ?? 'Request failed',
      data,
    };
  }

  return data as T;
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

  putMultipart,

  refreshAccessToken,
};
