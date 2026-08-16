import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTabs from './HomeTabs';
import AuthStack from './AuthStack';
import SplashScreen from '../screens/SplashScreen';
import AddTransactionScreen from '../screens/Home/AddTransactionScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  AddTransaction: { type?: 'income' | 'expense' };
};

const Stack = createNativeStackNavigator();

function RootStack() {
  const { userToken } = useAuth();
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!splashReady) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeTabs} />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default RootStack;
