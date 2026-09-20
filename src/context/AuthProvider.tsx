import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AuthContext } from './AuthContext';
import { getRefreshToken, storeRefreshToken } from '../utils/storeToken';
import { api, clearAuthTokens, setAccessToken } from '../services/apiService';
import { clearUser, fetchCurrentUser } from '../store/userSlice';
import { clearCategories, fetchCategories } from '../store/categoriesSlice';
import type { AppDispatch } from '../store/store';

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthenticatedState = async () => {
    await clearAuthTokens();
    dispatch(clearUser());
    dispatch(clearCategories());
    setUserToken(null);
  };

  const loadAuthenticatedData = async () => {
    await dispatch(fetchCurrentUser()).unwrap();

    try {
      await dispatch(fetchCategories()).unwrap();
    } catch (error) {
      console.log('Error loading authenticated data: ', error);
      await dispatch(clearCategories());
    }
  };

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          dispatch(clearUser());
          dispatch(clearCategories());
          return;
        }

        const accessToken = await api.refreshAccessToken();

        if (!accessToken) {
          await clearAuthenticatedState();
          return;
        }

        if (isMounted) {
          setUserToken(accessToken);
        }

        await loadAuthenticatedData();
      } catch (error) {
        console.log('Error restoring session: ', error);
        await clearAuthenticatedState();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const signIn = async (accessToken: string, refreshToken: string) => {
    setIsLoading(true);

    try {
      await storeRefreshToken(refreshToken);
      setAccessToken(accessToken);
      setUserToken(accessToken);
      await loadAuthenticatedData();
    } catch (error) {
      await clearAuthenticatedState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.log('Error signing out: ', error);
      }
    }

    await clearAuthenticatedState();
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
