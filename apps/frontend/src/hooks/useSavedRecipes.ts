import { useState, useCallback } from 'react';
import { get, set, del } from '../offline/storage';
import type { RecipeListItem } from '../api/recipes';

const KEY = 'savedIds';

function load(): string[] {
  return get<string[]>(KEY) ?? [];
}

export function useSavedRecipes() {
  const [ids, setIds] = useState<string[]>(load);

  // Writes both the id index and the offline payload SavedScreen reads.
  const save = useCallback((recipe: RecipeListItem) => {
    const next = [...new Set([...ids, recipe.slug])];
    set(KEY, next);
    set(`saved:${recipe.slug}`, recipe);
    setIds(next);
  }, [ids]);

  const unsave = useCallback((slug: string) => {
    const next = ids.filter(id => id !== slug);
    set(KEY, next);
    del(`saved:${slug}`);
    setIds(next);
  }, [ids]);

  const isSaved = useCallback((slug: string) => ids.includes(slug), [ids]);

  return { ids, save, unsave, isSaved };
}

