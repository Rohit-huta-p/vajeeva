// Offline catalog engine: full-replace sync (with GC of removed recipes),
// hydrate-from-storage, and client-side diacritic-folded search. Storage is a
// real in-memory fake so persistence + GC are exercised end to end.
jest.mock('../src/api', () => ({ api: { get: jest.fn() } }));
jest.mock('../src/offline/storage', () => {
  const store = new Map<string, any>();
  return {
    __store: store,
    get: jest.fn(async (k: string) => (store.has(k) ? store.get(k) : null)),
    getMany: jest.fn(async (keys: string[]) => {
      const out: Record<string, any> = {};
      for (const k of keys) if (store.has(k)) out[k] = store.get(k);
      return out;
    }),
    set: jest.fn(async (k: string, v: any) => { store.set(k, v); }),
    del: jest.fn(async (k: string) => { store.delete(k); }),
  };
});

import { api } from '../src/api';
import * as storage from '../src/offline/storage';
import {
  hydrateCatalog, syncCatalog, getAllRecipes, getRecipe, searchCatalog, getMeta, __resetCatalog,
} from '../src/offline/catalog';

const store = (storage as any).__store as Map<string, any>;
const mockGet = api.get as jest.Mock;

const R = (slug: string, extra: Record<string, any> = {}) => ({
  slug, nameEn: slug, category: 'solid',
  ingredients: [], steps: [], healthFlags: [], sources: [], ...extra,
});

beforeEach(() => {
  store.clear();
  __resetCatalog();
  jest.clearAllMocks();
});

test('syncCatalog persists full docs, populates memory, and stamps meta', async () => {
  mockGet.mockResolvedValueOnce({ data: [R('a'), R('b')] });
  const { count } = await syncCatalog();

  expect(count).toBe(2);
  expect(getAllRecipes().map(r => r.slug)).toEqual(['a', 'b']);
  expect(getRecipe('a')?.slug).toBe('a');
  expect(store.get('catalog:index')).toEqual(['a', 'b']);
  expect(store.get('recipe:a')).toBeTruthy();
  expect((await getMeta()).lastSyncedAt).toEqual(expect.any(String));
});

test('syncCatalog garbage-collects recipes that disappear from the server', async () => {
  mockGet.mockResolvedValueOnce({ data: [R('a'), R('b')] });
  await syncCatalog();

  mockGet.mockResolvedValueOnce({ data: [R('a')] }); // 'b' unpublished/removed
  await syncCatalog();

  expect(getAllRecipes().map(r => r.slug)).toEqual(['a']);
  expect(getRecipe('b')).toBeUndefined();
  expect(store.has('recipe:b')).toBe(false); // file GC'd, not just hidden
  expect(store.get('catalog:index')).toEqual(['a']);
});

test('hydrateCatalog loads a persisted catalog into memory (offline boot)', async () => {
  store.set('catalog:index', ['x']);
  store.set('recipe:x', R('x', { nameEn: 'Amla Juice' }));

  await hydrateCatalog();

  expect(getRecipe('x')?.nameEn).toBe('Amla Juice');
  expect(getAllRecipes()).toHaveLength(1);
});

test('hydrateCatalog skips index entries whose payload is missing/corrupt', async () => {
  store.set('catalog:index', ['x', 'gone']);
  store.set('recipe:x', R('x'));
  // 'recipe:gone' intentionally absent
  await hydrateCatalog();
  expect(getAllRecipes().map(r => r.slug)).toEqual(['x']);
});

test('searchCatalog matches name, ingredient and description; folds diacritics; ANDs terms', async () => {
  mockGet.mockResolvedValueOnce({ data: [
    R('coconut-barfi', { nameEn: 'Coconut Barfi', ingredients: [{ nameEn: 'coconut' }, { nameEn: 'ghee' }] }),
    R('amla-juice',    { nameEn: 'Ámla Juice', description: 'a sour cooling drink' }),
    R('barley-soup',   { nameEn: 'Barley Soup', ingredients: [{ nameEn: 'barley' }] }),
  ] });
  await syncCatalog();

  expect(searchCatalog('coconut').map(r => r.slug)).toEqual(['coconut-barfi']); // name + ingredient
  expect(searchCatalog('ghee').map(r => r.slug)).toEqual(['coconut-barfi']);    // ingredient only
  expect(searchCatalog('sour cooling').map(r => r.slug)).toEqual(['amla-juice']); // description, AND
  expect(searchCatalog('amla').map(r => r.slug)).toEqual(['amla-juice']);        // fold: 'amla' ~ 'Ámla'
  expect(searchCatalog('coconut soup')).toEqual([]);                            // AND across terms
  expect(searchCatalog('   ')).toEqual([]);                                     // blank → []
});

test('syncCatalog tolerates a non-array / malformed response', async () => {
  mockGet.mockResolvedValueOnce({ data: null });
  const { count } = await syncCatalog();
  expect(count).toBe(0);
  expect(getAllRecipes()).toEqual([]);
});
