import { useState, useEffect, useCallback } from 'react';
import { get, set, del } from '../offline/storage';

const KEY = 'cook:session';

export interface CookSession {
  slug: string;
  title: string;
  texture: string;
  stepIndex: number;
  totalSteps: number;
  startedAt: number;
}

// Single active cook session, persisted offline so HomeScreen can offer
// "Continue cooking" across app restarts. Storage is async: the persisted
// session loads once into React state; mutations persist in the background.
export function useCookSession() {
  const [session, setSession] = useState<CookSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Exposed so screens can re-pull on focus (tabs stay mounted).
  const reload = useCallback(async () => {
    const s = await get<CookSession>(KEY);
    setSession(s);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const startSession = useCallback((s: CookSession) => {
    set(KEY, s);
    setSession(s);
  }, []);

  const updateStep = useCallback((stepIndex: number) => {
    setSession(prev => {
      if (!prev) return prev;
      const next = { ...prev, stepIndex };
      set(KEY, next);
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    del(KEY);
    setSession(null);
  }, []);

  return { session, loading, reload, startSession, updateStep, clearSession };
}
