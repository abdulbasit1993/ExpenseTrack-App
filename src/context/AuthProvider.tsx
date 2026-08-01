import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { getJwtToken, removeJwtToken } from '../utils/storeToken';

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const token = await getJwtToken();

      if (token) {
        setUserToken(token);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = (token: string) => {
    setUserToken(token);
  };

  const signOut = async () => {
    await removeJwtToken();
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
