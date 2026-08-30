// Offline header images. Each recipe has one header photo (a remote Cloudinary
// URL); this downloads them all to the device so recipes render with no network.
// Files live in the persistent document directory (NOT cache — the OS purges
// cache under storage pressure, which would silently break the offline promise).
//
// Files are content-addressed by a hash of the source URL: the same URL dedupes
// to one file, and a replaced photo (new Cloudinary URL) downloads a fresh file
// while the old one is garbage-collected. A slug→{sourceUrl, localUri} manifest
// is persisted and mirrored in memory so render is synchronous (see imageSource).
import { File, Directory, Paths } from 'expo-file-system';
import { get, set } from './storage';
import { sortImages, cloudThumb } from '../api/recipes';
import type { RecipeDoc } from '../api/recipes';

const DIR = 'recipe-images';
const MANIFEST_KEY = 'img:manifest';

interface ImgEntry { sourceUrl: string; localUri: string }
type Manifest = Record<string, ImgEntry>;

// In-memory mirror of the persisted manifest, read synchronously at render time.
let manifest: Manifest = {};

/** djb2 → base36, a short stable filename for a source URL (content-addressing). */
function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** The local file:// URI for a recipe's downloaded header, or undefined. */
export function localImageUri(slug: string): string | undefined {
  return manifest[slug]?.localUri;
}

/** How many header photos are downloaded (for the offline storage panel). */
export function cachedImageCount(): number {
  return Object.keys(manifest).length;
}

/** Load the persisted manifest into memory. Offline-safe; call once at boot. */
export async function hydrateImages(): Promise<void> {
  manifest = (await get<Manifest>(MANIFEST_KEY)) ?? {};
}

/** Run async tasks with a concurrency cap (downloads are network-heavy). */
async function runLimited(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
  let i = 0;
  const worker = async () => { while (i < tasks.length) { await tasks[i++](); } };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

/**
 * Download every recipe's header image that isn't already cached, skip unchanged
 * ones, keep the previous file when a re-download fails, and GC any file no longer
 * referenced (removed recipes or superseded URLs). Best-effort: a failed download
 * just leaves that recipe falling back to its remote URL at render.
 */
export async function syncImages(recipes: RecipeDoc[]): Promise<void> {
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const next: Manifest = {};
  const tasks: Array<() => Promise<void>> = [];

  for (const r of recipes) {
    const url = sortImages(r.images)[0]?.url;
    if (!url) continue;
    const prev = manifest[r.slug];
    if (prev?.sourceUrl === url) { next[r.slug] = prev; continue; } // unchanged → keep
    tasks.push(async () => {
      try {
        const target = new File(dir, hashUrl(url));
        if (!target.exists) await File.downloadFileAsync(url, target); // dedupe shared URLs
        next[r.slug] = { sourceUrl: url, localUri: target.uri };
      } catch {
        if (prev) next[r.slug] = prev; // keep the old image rather than nothing
      }
    });
  }
  await runLimited(tasks, 4);

  // GC: delete any file in the directory the new manifest no longer references.
  const keep = new Set(Object.values(next).map(e => e.localUri));
  try {
    for (const entry of dir.list()) {
      if (!keep.has(entry.uri)) { try { entry.delete(); } catch { /* ignore */ } }
    }
  } catch { /* dir vanished — nothing to GC */ }

  manifest = next;
  await set(MANIFEST_KEY, next);
}

/**
 * Image source for a recipe surface: the on-device file when downloaded (offline,
 * ignores w/h — one rendition serves every size, RN downsamples), else the sized
 * remote Cloudinary thumb. The single choke point every <Image> goes through.
 */
export function imageSource(slug: string, remoteUrl: string, w: number, h: number): { uri: string };
export function imageSource(slug: string, remoteUrl: string | undefined, w: number, h: number): { uri: string } | undefined;
export function imageSource(slug: string, remoteUrl: string | undefined, w: number, h: number): { uri: string } | undefined {
  const local = localImageUri(slug);
  if (local) return { uri: local };
  if (remoteUrl) return { uri: cloudThumb(remoteUrl, w, h) };
  return undefined;
}

/** Test-only: reset the in-memory manifest. */
export function __resetImages(): void { manifest = {}; }
