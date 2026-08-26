import type { RecipeListItem } from '../api/recipes';

// "Find something to cook" facets for the Home mood chips. Quick / No-cook /
// Cooling derive from fields the list already carries (cook time, category);
// Sweet / Make-ahead read admin-authored discovery tags (dietTags, makeAhead —
// see docs/specs/2026-08-24-discovery-tags.md). Untagged recipes simply don't
// match, so those two chips are empty until recipes are tagged in the admin.
export type FacetKey = 'quick' | 'no-cook' | 'make-ahead' | 'sweet' | 'cooling';

export interface Facet {
  key: FacetKey;
  label: string;
  /** icon id resolved to a component at the render site (keeps this module JSX-free) */
  icon: 'clock' | 'leaf' | 'moon' | 'spoon' | 'drop';
}

export const FACETS: Facet[] = [
  { key: 'quick',      label: 'Quick',           icon: 'clock' },
  { key: 'no-cook',    label: 'No-cook',         icon: 'leaf' },
  { key: 'make-ahead', label: 'Make-ahead',      icon: 'moon' },
  { key: 'sweet',      label: 'Something sweet', icon: 'spoon' },
  { key: 'cooling',    label: 'A cooling drink', icon: 'drop' },
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
    case 'quick':      return r.cookTimeMin > 0 && r.cookTimeMin <= 20;
    case 'no-cook':    return r.cookTimeMin === 0;
    case 'make-ahead': return r.makeAhead === true;
    case 'sweet':      return (r.dietTags ?? []).includes('sweet');
    case 'cooling':    return r.category === 'liquid' || (r.meals ?? []).includes('drink');
    default:           return true;
  }
}

// Value-axis filters (one tag code within a single axis) — for RecipeList deep
// links (?ingredient=coconut, ?type=laddu, …) and the Home "Cook with…" tiles.
export type TagAxis = 'type' | 'meal' | 'ingredient' | 'method';

export function matchTag(r: RecipeListItem, axis: TagAxis, value: string): boolean {
  switch (axis) {
    case 'type':       return r.type === value;
    case 'meal':       return (r.meals ?? []).includes(value);
    case 'ingredient': return (r.mainIngredients ?? []).includes(value);
    case 'method':     return (r.methods ?? []).includes(value);
    default:           return true;
  }
}
