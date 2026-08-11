import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AuthContext } from './AuthContext';
import { getJwtToken, removeJwtToken } from '../utils/storeToken';
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
        const token = await getJwtToken();

        if (!token) {
          dispatch(clearUser());
          dispatch(clearCategories());
          return;
        }

        if (isMounted) {
          setUserToken(token);
        }

        await loadAuthenticatedData();
      } catch (error) {
        console.log('Error restoring session: ', error);
        await removeJwtToken();
        dispatch(clearUser());
        dispatch(clearCategories());

        if (isMounted) {
          setUserToken(null);
        }
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

  const signIn = async (token: string) => {
    setIsLoading(true);
    setUserToken(token);

    try {
      await loadAuthenticatedData();
    } catch (error) {
      await removeJwtToken();
      dispatch(clearUser());
      dispatch(clearCategories());
      setUserToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await removeJwtToken();
    dispatch(clearUser());
    dispatch(clearCategories());
    setUserToken(null);
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
