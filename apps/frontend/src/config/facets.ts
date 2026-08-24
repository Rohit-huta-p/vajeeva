import type { RecipeListItem } from '../api/recipes';

// "Find something to cook" facets for the Home mood chips. Every predicate is
// derived from fields the list already carries (cook time, category) — no admin
// data, no engine. Sweet / Make-ahead are intentionally NOT here: they'd need a
// recipe type/tag field that doesn't exist yet (see the redesign notes).
export type FacetKey = 'quick' | 'no-cook' | 'cooling';

export interface Facet {
  key: FacetKey;
  label: string;
  /** icon id resolved to a component at the render site (keeps this module JSX-free) */
  icon: 'clock' | 'leaf' | 'drop';
}

export const FACETS: Facet[] = [
  { key: 'quick',   label: 'Quick',           icon: 'clock' },
  { key: 'no-cook', label: 'No-cook',         icon: 'leaf' },
  { key: 'cooling', label: 'A cooling drink', icon: 'drop' },
];

export function isFacet(key: string | undefined): key is FacetKey {
  return !!key && FACETS.some(f => f.key === key);
}

export function facetLabel(key: string): string {
  return FACETS.find(f => f.key === key)?.label ?? key;
}

// cookTimeMin is the summed step-timer minutes; 0 is the app's existing
// "No-cook" convention (see RecipeGridCard).
export function matchFacet(r: RecipeListItem, key: string): boolean {
  switch (key) {
    case 'quick':   return r.cookTimeMin > 0 && r.cookTimeMin <= 20;
    case 'no-cook': return r.cookTimeMin === 0;
    case 'cooling': return r.category === 'liquid';
    default:        return true;
  }
}
