import { Slot, useRouter, useSegments } from 'expo-router';
import { useContext, useEffect, type ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, AuthContext } from '../src/auth/AuthContext';

SplashScreen.preventAutoHideAsync();

// Session route-gating (AUTH-WAVE-1): no session -> /auth/opening; with a
// session (or guest browsing) the whole app is reachable. Auth screens manage
// their own forward navigation — the gate never forces a signed-in user out of
// the auth group, so multi-step signup/onboarding isn't interrupted mid-flow.
// Contract with the auth rework: `isLoading` + a nullable `session` (today
// named `user`); an optional `isGuest` flag is honored when the context grows
// the guest-browse path.
function AuthGate({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  const loose = auth as { user?: unknown; session?: unknown; isGuest?: boolean };
  const hasSession = (loose.session ?? loose.user) != null;
  const allowed = hasSession || loose.isGuest === true;
  const inAuthGroup = segments[0] === 'auth';
  const mustRedirect = !auth.isLoading && !allowed && !inAuthGroup;

  useEffect(() => {
    if (mustRedirect) router.replace('/auth/opening' as any);
  }, [mustRedirect, router]);

  // Hold rendering while the session restores, and don't flash gated content
  // during the redirect frame.
  if (auth.isLoading || mustRedirect) return null;
  return <>{children}</>;
}

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
      <AuthGate>
        <Slot />
      </AuthGate>
    </AuthProvider>
  );
}
