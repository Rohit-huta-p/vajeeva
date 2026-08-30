// The offline recipe catalog. The whole published corpus (~100 small docs) is
// mirrored on-device so list / detail / search all work with no network. Screens
// read the in-memory snapshot synchronously; the network lives only in the sync
// engine (OfflineProvider drives it).
//
// Source endpoint is the PUBLIC GET /api/recipes (full `Recipe.find().lean()`
// docs, no auth) — so the cache works for guests too. The auth-gated
// /api/sync/recipes?since= delta stays a future signed-in optimization.
import { get, getMany, set, del } from './storage';
import { api } from '../api';
import type { RecipeDoc } from '../api/recipes';
import seedJson from '../../assets/catalog-seed.json';

// Bundled first-launch seed (built by scripts/build-catalog-seed.mjs). Used only
// when nothing has been synced yet, so a brand-new install shows the catalog
// offline before its first sync; the first successful sync full-replaces it.
const BUNDLED_SEED = seedJson as unknown as RecipeDoc[];

const INDEX_KEY = 'catalog:index';
const META_KEY = 'catalog:meta';
const recipeKey = (slug: string) => `recipe:${slug}`;

export interface CatalogMeta { lastSyncedAt: string | null }

// In-memory snapshot the screens read synchronously. Hydrated from storage at
// boot, replaced after each sync. `order` preserves the server's ordering.
let bySlug = new Map<string, RecipeDoc>();
let order: string[] = [];

export function getAllRecipes(): RecipeDoc[] {
  return order.map(s => bySlug.get(s)).filter(Boolean) as RecipeDoc[];
}

export function getRecipe(slug: string): RecipeDoc | undefined {
  return bySlug.get(slug);
}

function loadIntoMemory(recipes: RecipeDoc[]): void {
  order = recipes.map(r => r.slug).filter(Boolean);
  bySlug = new Map(recipes.filter(r => r.slug).map(r => [r.slug, r]));
}

/**
 * Load the persisted catalog into memory. Offline-safe; call once at boot. When
 * nothing has been synced yet (fresh install), fall back to the bundled seed so
 * the app shows the catalog offline from the very first launch.
 */
export async function hydrateCatalog(): Promise<void> {
  const index = (await get<string[]>(INDEX_KEY)) ?? [];
  if (index.length === 0) { loadIntoMemory(BUNDLED_SEED); return; }
  const payloads = await getMany<RecipeDoc>(index.map(recipeKey));
  order = index.filter(s => payloads[recipeKey(s)]);
  bySlug = new Map(order.map(s => [s, payloads[recipeKey(s)]]));
}

/**
 * Full pull from the server; replaces the catalog and reconciles deletions.
 * At ~100 recipes the payload is sub-1 MB, and a full replace correctly drops
 * recipes that were unpublished or removed (which a `since=` delta can't without
 * tombstones). Throws on network/server error — the caller keeps the cache.
 */
export async function syncCatalog(): Promise<{ count: number }> {
  const { data } = await api.get<RecipeDoc[]>('/api/recipes');
  const recipes = (Array.isArray(data) ? data : []).filter(r => r?.slug);
  const nextOrder = recipes.map(r => r.slug);
  const nextSet = new Set(nextOrder);

  const prevIndex = (await get<string[]>(INDEX_KEY)) ?? [];
  await Promise.all([
    ...recipes.map(r => set(recipeKey(r.slug), r)),                     // upsert current
    ...prevIndex.filter(s => !nextSet.has(s)).map(s => del(recipeKey(s))), // GC gone
  ]);
  await set(INDEX_KEY, nextOrder);
  await set<CatalogMeta>(META_KEY, { lastSyncedAt: new Date().toISOString() });

  order = nextOrder;
  bySlug = new Map(recipes.map(r => [r.slug, r]));
  return { count: nextOrder.length };
}

export async function getMeta(): Promise<CatalogMeta> {
  return (await get<CatalogMeta>(META_KEY)) ?? { lastSyncedAt: null };
}

/** Lowercase + strip diacritics, mirroring the server's diacritic-folded search
 *  so a missing accent still matches. Falls back to plain lowercase where the JS
 *  engine lacks Unicode normalize. */
function fold(s: string): string {
  try { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  catch { return s.toLowerCase(); }
}

/**
 * Client-side search over the cached catalog: substring match across name
 * (EN + Tamil), ingredients and description, AND-ed across whitespace-separated
 * terms. A simpler approximation of the server's Atlas fuzzy search, but it works
 * offline and is instant at this corpus size. Blank query → [] (mirrors server).
 */
export function searchCatalog(q: string): RecipeDoc[] {
  const terms = fold(q.trim()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return getAllRecipes().filter(r => {
    const hay = fold([
      r.nameEn, r.nameTa ?? '', r.description ?? '',
      ...(r.ingredients ?? []).map(i => i.nameEn),
    ].join(' '));
    return terms.every(t => hay.includes(t));
  });
}

/** Test-only: reset the in-memory snapshot. */
export function __resetCatalog(): void {
  bySlug = new Map();
  order = [];
}
