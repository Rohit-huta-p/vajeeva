import { useState, useCallback } from 'react';
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
// "Continue cooking" across app restarts.
export function useCookSession() {
  const [session, setSession] = useState<CookSession | null>(() => get<CookSession>(KEY));

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

  return { session, startSession, updateStep, clearSession };
}
