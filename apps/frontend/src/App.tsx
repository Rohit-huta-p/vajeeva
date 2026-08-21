import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './auth/AuthContext';
import { AuthContext } from './auth/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { initSaved, clearSaved } from './hooks/useSavedRecipes';

function AppInner() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      initSaved();
    } else {
      clearSaved();
    }
  }, [user]);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
