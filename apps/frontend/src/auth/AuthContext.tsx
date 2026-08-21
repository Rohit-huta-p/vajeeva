import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi, setAccessToken, setRefreshToken, getRefreshToken } from '../api';

interface AuthState {
  user: { email: string } | null;
  isLoading: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rt = getRefreshToken();
        if (rt) {
          const { data } = await authApi.refresh(rt);
          setAccessToken(data.accessToken);
        }
      } catch { /* stay logged out */ }
      finally { setIsLoading(false); }
    })();
  }, []);

  const persist = useCallback(async (email: string, accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser({ email });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const rt = (data as any).refreshToken ?? '';
    await persist(email, data.accessToken, rt);
  }, [persist]);

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.register(email, password);
    const rt = (data as any).refreshToken ?? '';
    await persist(email, data.accessToken, rt);
  }, [persist]);

  const logout = useCallback(async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
