import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type Colors } from './tokens';
import * as storage from '../offline/storage';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'appearance';

interface ThemeState {
  colors: Colors;
  scheme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

// Default context is light, so components that read the theme without a provider
// (e.g. in unit tests) still resolve real colors.
const ThemeCtx = createContext<ThemeState>({
  colors: lightColors, scheme: 'light', mode: 'system', setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let alive = true;
    storage.get<ThemeMode>(KEY)
      .then(m => { if (alive && (m === 'light' || m === 'dark' || m === 'system')) setModeState(m); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    storage.set(KEY, m).catch(() => {});
  }, []);

  const scheme: 'light' | 'dark' = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeState>(() => ({
    colors: scheme === 'dark' ? darkColors : lightColors,
    scheme, mode, setMode,
  }), [scheme, mode, setMode]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

// Build a StyleSheet from the active palette, rebuilt only when the scheme flips.
// Pass a module-level factory so the memo identity is stable.
export function useThemedStyles<T>(factory: (c: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
