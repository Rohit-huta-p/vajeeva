// Offline header-image engine: download + content-addressed dedupe, skip
// unchanged, GC superseded/removed files, and the imageSource render choke point.
// expo-file-system is mocked as an in-memory filesystem so the logic runs end to
// end without native modules.
jest.mock('expo-file-system', () => {
  const files = new Set<string>();   // existing file uris
  const downloads: string[] = [];    // urls passed to downloadFileAsync
  const join = (parts: any[]) => parts.map(p => (p && p.uri) || p).join('/');
  class Directory {
    uri: string;
    constructor(...parts: any[]) { this.uri = join(parts); }
    get exists() { return true; }
    create() { /* no-op */ }
    list() { return [...files].map(u => new File(u)); }
  }
  class File {
    uri: string;
    constructor(...parts: any[]) { this.uri = join(parts); }
    get exists() { return files.has(this.uri); }
    delete() { files.delete(this.uri); }
    static async downloadFileAsync(url: string, dest: any) { downloads.push(url); files.add(dest.uri); return dest; }
  }
  return { __esModule: true, File, Directory, Paths: { document: 'file:///doc' }, __files: files, __downloads: downloads };
});
jest.mock('../src/offline/storage', () => {
  const store = new Map<string, any>();
  return {
    __store: store,
    get: jest.fn(async (k: string) => (store.has(k) ? store.get(k) : null)),
    set: jest.fn(async (k: string, v: any) => { store.set(k, v); }),
    del: jest.fn(async (k: string) => { store.delete(k); }),
    getMany: jest.fn(async () => ({})),
  };
});

import * as fs from 'expo-file-system';
import * as storage from '../src/offline/storage';
import { syncImages, hydrateImages, localImageUri, imageSource, __resetImages } from '../src/offline/images';

const files = (fs as any).__files as Set<string>;
const downloads = (fs as any).__downloads as string[];
const store = (storage as any).__store as Map<string, any>;

const R = (slug: string, url?: string) => ({
  slug, nameEn: slug, category: 'solid', ingredients: [], steps: [], healthFlags: [], sources: [],
  images: url ? [{ url }] : [],
}) as any;

beforeEach(() => {
  files.clear(); downloads.length = 0; store.clear(); __resetImages(); jest.clearAllMocks();
});

test('downloads each recipe header and records + persists the manifest', async () => {
  await syncImages([R('a', 'https://cdn/upload/a.jpg'), R('b', 'https://cdn/upload/b.jpg')]);
  expect(downloads).toHaveLength(2);
  expect(localImageUri('a')).toMatch(/recipe-images/);
  expect(store.get('img:manifest').a.sourceUrl).toBe('https://cdn/upload/a.jpg');
});

test('recipes without a header image are skipped', async () => {
  await syncImages([R('a')]);
  expect(downloads).toHaveLength(0);
  expect(localImageUri('a')).toBeUndefined();
});

test('unchanged URLs are not re-downloaded on the next sync', async () => {
  await syncImages([R('a', 'https://cdn/upload/a.jpg')]);
  downloads.length = 0;
  await syncImages([R('a', 'https://cdn/upload/a.jpg')]);
  expect(downloads).toHaveLength(0);
  expect(localImageUri('a')).toMatch(/recipe-images/);
});

test('a changed header URL downloads a fresh file and GCs the old one', async () => {
  await syncImages([R('a', 'https://cdn/upload/old.jpg')]);
  const oldUri = localImageUri('a')!;
  await syncImages([R('a', 'https://cdn/upload/new.jpg')]);
  const newUri = localImageUri('a')!;
  expect(newUri).not.toBe(oldUri);
  expect(files.has(newUri)).toBe(true);
  expect(files.has(oldUri)).toBe(false); // superseded → GC'd
});

test('a removed recipe GCs its image file', async () => {
  await syncImages([R('a', 'https://cdn/upload/a.jpg'), R('b', 'https://cdn/upload/b.jpg')]);
  const bUri = localImageUri('b')!;
  await syncImages([R('a', 'https://cdn/upload/a.jpg')]); // 'b' gone
  expect(localImageUri('b')).toBeUndefined();
  expect(files.has(bUri)).toBe(false);
});

test('hydrateImages restores the persisted manifest', async () => {
  store.set('img:manifest', { a: { sourceUrl: 'u', localUri: 'file:///doc/recipe-images/x' } });
  await hydrateImages();
  expect(localImageUri('a')).toBe('file:///doc/recipe-images/x');
});

test('imageSource prefers the local file, else the remote thumb, else undefined', async () => {
  store.set('img:manifest', { a: { sourceUrl: 'u', localUri: 'file:///local/a' } });
  await hydrateImages();
  expect(imageSource('a', 'https://cdn/upload/a.jpg', 100, 100)).toEqual({ uri: 'file:///local/a' });
  const remote = imageSource('b', 'https://res.cloudinary.com/x/image/upload/v1/a.jpg', 100, 100);
  expect(remote!.uri).toContain('/upload/c_fill'); // cloudThumb transform applied
  expect(imageSource('c', undefined, 100, 100)).toBeUndefined();
});
