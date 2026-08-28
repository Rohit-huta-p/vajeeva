// Typed recipe surface for screens. The axios client lives in src/api.ts;
// this module re-exports it under the path the UI plan imports from and adds
// adapters from raw API documents to the shapes the UI renders.
export { recipesApi, savedApi } from '../api';

export interface RecipeImage {
  url: string;
  alt?: string;
  order?: number;
}

export type FitLevel = 'safe' | 'caution' | 'avoid';

export interface RecipeListItem {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: string;
  cookTimeMin: number;
  /** number of active contra conditions (non-'safe' healthFlags) */
  contraCount: number;
  /**
   * Health fit derived from the recipe's healthFlags, or `null` when the recipe
   * carries no flag data (unassessed) — the fit badge renders only when non-null
   * (and the FEATURES.fitBadge flag is on). See `deriveFit`.
   */
  fit: FitLevel | null;
  /** number of method steps */
  stepCount: number;
  /** batch yield, e.g. "Makes 3–4" (verbatim from the recipe) */
  yieldStr?: string;
  /** raw URL of the recipe's first image, if any (thumb via cloudThumb) */
  imageUrl?: string;
  // Discovery tags (admin-authored; empty until a recipe is tagged).
  // See docs/specs/2026-08-24-discovery-tags.md.
  type?: string;
  meals?: string[];
  mainIngredients?: string[];
  methods?: string[];
  dietTags?: string[];
  makeAhead?: boolean;
}

/**
 * Reduce a recipe's healthFlags to a single fit level for the card badge.
 * Returns `null` when there are no flags — an unassessed recipe, which must NOT
 * read as "Safe". Worst severity wins: any 'avoid' → avoid; else any 'caution'
 * → caution; else (flags exist and all are 'safe') → safe.
 */
export function deriveFit(flags: RecipeDoc['healthFlags'] | undefined): FitLevel | null {
  const list = flags ?? [];
  if (list.length === 0) return null;
  if (list.some(f => f.severity === 'avoid')) return 'avoid';
  if (list.some(f => f.severity === 'caution')) return 'caution';
  return 'safe';
}

// Shape of a recipe document as served by GET /api/recipes[/:slug].
export interface RecipeDoc {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: 'solid' | 'liquid' | 'semi-solid';
  description?: string;
  ingredients: { nameEn: string; quantityG?: string; quantityCup?: string }[];
  steps: {
    order: number; text: string; phase?: string; heat?: string | null;
    images?: RecipeImage[] | null;
  }[];
  healthFlags: { condition: string; severity: 'safe' | 'caution' | 'avoid'; note?: string }[];
  sources: { text: string; citation?: string }[];
  yieldStr?: string;
  shelfLife?: string;
  images?: RecipeImage[] | null;
  type?: string;
  meals?: string[];
  mainIngredients?: string[];
  methods?: string[];
  dietTags?: string[];
  makeAhead?: boolean;
}

/** Valid images sorted by their order field (absent/null-safe). */
export function sortImages(images?: RecipeImage[] | null): RecipeImage[] {
  return (images ?? [])
    .filter(im => typeof im?.url === 'string' && im.url.length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Derive a sized thumbnail from a Cloudinary secure_url by inserting a fill
 * transform after /upload/. Non-Cloudinary URLs pass through unchanged.
 */
export function cloudThumb(url: string, w: number, h: number): string {
  const marker = '/upload/';
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return `${url.slice(0, i + marker.length)}c_fill,w_${Math.round(w)},h_${Math.round(h)},q_auto,f_auto/${url.slice(i + marker.length)}`;
}

export function toListItem(doc: RecipeDoc): RecipeListItem {
  return {
    slug: doc.slug,
    nameEn: doc.nameEn,
    nameTa: doc.nameTa,
    category: doc.category,
    cookTimeMin: (doc as any).totalTimeMin ?? 0,
    contraCount: (doc.healthFlags ?? []).filter(f => f.severity !== 'safe').length,
    fit: deriveFit(doc.healthFlags),
    stepCount: (doc.steps ?? []).length,
    yieldStr: doc.yieldStr,
    imageUrl: sortImages(doc.images)[0]?.url,
    type: doc.type,
    meals: doc.meals,
    mainIngredients: doc.mainIngredients,
    methods: doc.methods,
    dietTags: doc.dietTags,
    makeAhead: doc.makeAhead,
  };
}
