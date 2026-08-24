import { useState, useEffect, useCallback } from 'react';
import { get, set } from '../offline/storage';
import type { RecipeListItem } from '../api/recipes';

const KEY = 'recentlyViewed';
const CAP = 8;

// On-device recently-viewed list — the same offline-first pattern as
// useSavedRecipes / useCookSession. No admin data, no server: purely the user's
// own history, so Home can offer "Jump back in".

/** Record a viewed recipe (most-recent-first, deduped, capped). Fire-and-forget. */
export async function recordRecentlyViewed(item: RecipeListItem): Promise<void> {
  try {
    const prev = (await get<RecipeListItem[]>(KEY)) ?? [];
    const next = [item, ...prev.filter(r => r.slug !== item.slug)].slice(0, CAP);
    await set(KEY, next);
  } catch {
    /* storage unavailable — non-critical */
  }
}

/** Read the recently-viewed list (loads once on mount, like the sibling hooks). */
export function useRecentlyViewed() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const list = await get<RecipeListItem[]>(KEY);
    setRecipes(list ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { recipes, loading, reload };
}
