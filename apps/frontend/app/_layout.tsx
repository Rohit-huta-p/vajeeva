import { Slot } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../src/auth/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Lora (SIL OFL, bundled in assets/fonts) — one brand serif on every
  // platform, replacing the old iOS-IowanOldStyle / Android-LibreBaskerville
  // split so serif metrics match across devices.
  const [fontsLoaded] = useFonts({
    'Lora': require('../assets/fonts/Lora-Regular.ttf'),
    'Lora-Bold': require('../assets/fonts/Lora-Bold.ttf'),
    'Lora-Italic': require('../assets/fonts/Lora-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
