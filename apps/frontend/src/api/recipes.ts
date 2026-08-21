// Typed recipe list surface for screens. The axios client lives in src/api.ts;
// this module re-exports it under the path the UI plan imports from.
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
