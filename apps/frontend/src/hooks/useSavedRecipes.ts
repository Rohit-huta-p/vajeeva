import { useState, useEffect, useCallback } from 'react';
import { get, getMany, set, del } from '../offline/storage';
import { savedApi } from '../api/recipes';
import type { RecipeListItem } from '../api/recipes';

const KEY = 'savedIds';

// Storage is async (AsyncStorage): persisted state loads once into React
// state, screens read the in-memory state synchronously, and mutations
// persist in the background. Same savedIds + saved:{slug} key scheme as before.
export function useSavedRecipes() {
  const [ids, setIds] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = (await get<string[]>(KEY)) ?? [];
      const payloads = await getMany<RecipeListItem>(stored.map(id => `saved:${id}`));
      if (!alive) return;
      setIds(stored);
      setRecipes(stored.map(id => payloads[`saved:${id}`]).filter(Boolean));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // Writes both the id index and the offline payload SavedScreen reads.
  const save = useCallback((recipe: RecipeListItem) => {
    setIds(prev => {
      const next = [...new Set([...prev, recipe.slug])];
      set(KEY, next);
      return next;
    });
    setRecipes(prev => prev.some(r => r.slug === recipe.slug) ? prev : [...prev, recipe]);
    set(`saved:${recipe.slug}`, recipe);
    // Additive cross-device sync; local storage stays the source of truth.
    savedApi.push([recipe.slug], []).catch(() => { /* offline or logged out */ });
  }, []);

  const unsave = useCallback((slug: string) => {
    setIds(prev => {
      const next = prev.filter(id => id !== slug);
      set(KEY, next);
      return next;
    });
    setRecipes(prev => prev.filter(r => r.slug !== slug));
    del(`saved:${slug}`);
    savedApi.push([], [slug]).catch(() => { /* offline or logged out */ });
  }, []);

  const isSaved = useCallback((slug: string) => ids.includes(slug), [ids]);

  return { ids, recipes, loading, save, unsave, isSaved };
}
