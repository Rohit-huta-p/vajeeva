import { Slot, useRouter, useSegments } from 'expo-router';
import { useContext, useEffect, type ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider, AuthContext } from '../src/auth/AuthContext';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { OfflineProvider } from '../src/offline/OfflineProvider';
import '../src/web.css';

SplashScreen.preventAutoHideAsync();

// Session route-gating (AUTH-WAVE-1): no session -> /auth/opening; with a
// session (or guest browsing) the whole app is reachable. Signed-in users are
// also bounced *out* of opening/login if they land there (typically via back
// button/gesture — those screens only ever get replaced forward, never popped
// off the stack, so they'd otherwise sit there reachable forever). signup and
// onboarding stay exempt from that reverse guard: register() flips hasSession
// true while still on /auth/signup, a beat before its own router.replace to
// /auth/onboarding fires, so guarding signup here would race that handoff and
// skip the health-profile step.
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
  const mustRedirectOut = !auth.isLoading && !allowed && !inAuthGroup;

  // expo-router types useSegments() as a union of exact-length tuples across
  // every route in the app, so a fixed index 1 doesn't type-check for the
  // shorter ones — widen for this read; it's a plain array at runtime.
  const authScreen = (segments as string[])[1];
  const guardedAuthScreen = inAuthGroup && authScreen !== 'signup' && authScreen !== 'onboarding';
  const mustRedirectIn = !auth.isLoading && hasSession && guardedAuthScreen;

  useEffect(() => {
    if (mustRedirectOut) router.replace('/auth/opening' as any);
    else if (mustRedirectIn) router.replace('/' as any);
  }, [mustRedirectOut, mustRedirectIn, router]);

  // Hold rendering while the session restores, and don't flash stale content
  // during either redirect frame.
  if (auth.isLoading || mustRedirectOut || mustRedirectIn) return null;
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
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
