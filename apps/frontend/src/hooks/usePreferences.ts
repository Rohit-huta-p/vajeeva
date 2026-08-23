import { useEffect, useState, useCallback } from 'react';
import * as storage from '../offline/storage';

export type Units = 'g' | 'cup';
export interface Preferences {
  units: Units;
  keepAwake: boolean;
}

const KEY = 'preferences';
const DEFAULTS: Preferences = {
  units: 'g',
  keepAwake: true, // cooking with dirty hands is the core case — default on
};

// Device preferences (local-only — no server). `units` seeds the recipe g/cup
// default; `keepAwake` gates the Cook-mode screen lock. Each consumer loads once
// on mount; separate screens read fresh when they mount, which is enough since
// they open after the Profile change that set the value.
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    storage.get<Partial<Preferences>>(KEY)
      .then(v => { if (alive && v) setPrefs({ ...DEFAULTS, ...v }); })
      .catch(() => { /* corrupt / missing — defaults stand */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const setPref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      storage.set(KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return { prefs, loading, setPref };
}
