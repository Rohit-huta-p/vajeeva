import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi, setAccessToken, setRefreshToken } from '../api';
import * as storage from '../offline/storage';

// Contract with the route gate (app/_layout.tsx AuthGate, Jim's):
//   isLoading — true only while the persisted session restores at launch;
//   user      — nullable session (non-null = signed in);
//   isGuest   — guest-browse flag; gate allows the app when user || isGuest.
// Session persists across restarts via offline/storage key 'session'
// ({ email, name?, refreshToken }); guest choice persists under 'guest'.

interface RegisterExtra { name?: string; phone?: string }

interface AuthState {
  user: { email: string; name?: string } | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, extra?: RegisterExtra) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

interface StoredSession { email: string; name?: string; refreshToken: string }

export const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the persisted session (or guest choice) at launch.
  useEffect(() => {
    (async () => {
      try {
        const [session, guest] = await Promise.all([
          storage.get<StoredSession>('session'),
          storage.get<boolean>('guest'),
        ]);
        if (session?.refreshToken) {
          const { data } = await authApi.refresh(session.refreshToken);
          setAccessToken(data.accessToken);
          setRefreshToken(session.refreshToken);
          setUser({ email: session.email, name: session.name });
        } else if (guest) {
          setIsGuest(true);
        }
      } catch {
        // Refresh failed (expired/revoked) — drop the stale session.
        await storage.del('session').catch(() => {});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (
    email: string, accessToken: string, refreshToken: string, name?: string,
  ) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    if (refreshToken) await storage.set<StoredSession>('session', { email, name, refreshToken });
    await storage.del('guest').catch(() => {});
    setIsGuest(false);
    setUser({ email, name });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await persist(email, data.accessToken, (data as any).refreshToken ?? '');
  }, [persist]);

  // extra.name / extra.phone ride along for BE-AUTH; today's API strips them.
  const register = useCallback(async (email: string, password: string, extra?: RegisterExtra) => {
    const { data } = await authApi.register(email, password, extra);
    await persist(email, data.accessToken, (data as any).refreshToken ?? '', extra?.name);
  }, [persist]);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    storage.set('guest', true).catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsGuest(false);
    await Promise.all([storage.del('session'), storage.del('guest')]).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isGuest, login, register, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
