import React from 'react';
import { useColorScheme } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootStack from './navigation/RootStack';
import AuthProvider from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import { COLORS } from './constants/colors';
import { persistor, store } from './store/store';

function App() {
  const systemColorScheme = useColorScheme();
  const isDarkMode = systemColorScheme === 'dark';

  const navTheme = {
    ...DefaultTheme,
    dark: isDarkMode,
    colors: {
      ...DefaultTheme.colors,
      primary: COLORS.PRIMARY,
      background: isDarkMode ? COLORS.dark.background : COLORS.light.background,
      card: isDarkMode ? COLORS.dark.card : COLORS.light.card,
      text: isDarkMode ? COLORS.dark.textPrimary : COLORS.light.textPrimary,
      border: isDarkMode ? COLORS.dark.border : COLORS.light.border,
      notification: COLORS.SUCCESS,
    },
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer theme={navTheme}>
                <RootStack />
              </NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
