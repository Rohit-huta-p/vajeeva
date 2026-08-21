// Typed recipe surface for screens. The axios client lives in src/api.ts;
// this module re-exports it under the path the UI plan imports from and adds
// adapters from raw API documents to the shapes the UI renders.
export { recipesApi, savedApi } from '../api';

export interface RecipeListItem {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: string;
  cookTimeMin: number;
  /** number of active contra conditions for the current user */
  contraCount: number;
}

// Shape of a recipe document as served by GET /api/recipes[/:slug].
export interface RecipeDoc {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: 'solid' | 'liquid' | 'semi-solid';
  description?: string;
  ingredients: { nameEn: string; quantityG?: string; quantityCup?: string }[];
  steps: { order: number; text: string; phase?: string; heat?: string | null; timerStr?: string | null }[];
  healthFlags: { condition: string; severity: 'safe' | 'caution' | 'avoid'; note?: string }[];
  sources: { text: string; citation?: string }[];
  yieldStr?: string;
  shelfLife?: string;
}

/** First integer in a timer string like "20 min", or 0. */
export function parseTimerMin(timerStr?: string | null): number {
  const m = timerStr?.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export function toListItem(doc: RecipeDoc): RecipeListItem {
  return {
    slug: doc.slug,
    nameEn: doc.nameEn,
    nameTa: doc.nameTa,
    category: doc.category,
    cookTimeMin: (doc.steps ?? []).reduce((sum, s) => sum + parseTimerMin(s.timerStr), 0),
    contraCount: (doc.healthFlags ?? []).filter(f => f.severity !== 'safe').length,
  };
}
