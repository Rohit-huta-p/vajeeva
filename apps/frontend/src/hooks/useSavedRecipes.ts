import { useState, useCallback } from 'react';
import { get, set } from '../offline/storage';

const KEY = 'savedIds';

function load(): string[] {
  return get<string[]>(KEY) ?? [];
}

export function useSavedRecipes() {
  const [ids, setIds] = useState<string[]>(load);

  const save = useCallback((slug: string) => {
    const next = [...new Set([...ids, slug])];
    set(KEY, next);
    setIds(next);
  }, [ids]);

  const unsave = useCallback((slug: string) => {
    const next = ids.filter(id => id !== slug);
    set(KEY, next);
    setIds(next);
  }, [ids]);

  const isSaved = useCallback((slug: string) => ids.includes(slug), [ids]);

  return { ids, save, unsave, isSaved };
}

// TODO(reconcile): compat no-ops for the legacy pre-router src/App.tsx, which
// imported the old server-backed initSaved/clearSaved. Remove once App.tsx is
// retired at final integration.
export async function initSaved() {}
export function clearSaved() {}
