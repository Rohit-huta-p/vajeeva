// src/hooks/useSavedRecipes.ts
// Module-level saved set — shared across all screens without a Context.
// Listeners re-render any component using the hook.
import { useState, useEffect, useCallback } from 'react';
import { savedApi } from '../api';

const savedIds = new Set<string>();
const listeners = new Set<() => void>();

function notify() { listeners.forEach(fn => fn()); }

let initialized = false;

/** Load saved list from the server once per session. */
export async function initSaved() {
  if (initialized) return;
  initialized = true;
  try {
    const ids = await savedApi.list();
    ids.forEach(id => savedIds.add(id));
    notify();
  } catch { /* offline or logged out — skip */ }
}

/** Reset on logout. */
export function clearSaved() {
  savedIds.clear();
  initialized = false;
  notify();
}

/** React hook — returns live isSaved + toggle for a given recipe slug. */
export function useSavedRecipe(slug: string) {
  const [isSaved, setIsSaved] = useState(() => savedIds.has(slug));

  useEffect(() => {
    const refresh = () => setIsSaved(savedIds.has(slug));
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, [slug]);

  const toggle = useCallback(async () => {
    const next = !savedIds.has(slug);
    if (next) savedIds.add(slug); else savedIds.delete(slug);
    notify();
    try {
      await savedApi.push(next ? [slug] : [], next ? [] : [slug]);
    } catch {
      // Revert on failure
      if (next) savedIds.delete(slug); else savedIds.add(slug);
      notify();
    }
  }, [slug]);

  return { isSaved, toggle };
}
