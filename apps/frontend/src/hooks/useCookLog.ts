import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set } from '../offline/storage';
import { cookLogApi, uploadsApi } from '../api/recipes';
import type { PhotoRef } from '../api/recipes';

const KEY = 'cooklog';

export interface PendingPhoto {
  localUri: string;              // on-device file:// URI, not yet uploaded
  caption?: string;
  status: 'pending' | 'failed';
}

export interface CookEntry {
  slug: string;
  madeAt: string;   // ISO — also the natural key the server upserts on
  rating?: number;  // 1–5, optional
  note?: string;
  photos?: PhotoRef[];            // uploaded prepared-dish photos (url + publicId)
  pendingPhotos?: PendingPhoto[]; // local URIs awaiting upload — never sent as-is
  synced?: boolean; // false until the server has accepted the make (+ its photos)
}

/**
 * The "I made this" log — the engagement + satisfaction anchor, now also the home
 * for prepared-dish photos (docs/specs/2026-09-09-prepared-photos.md).
 *
 * Local-first like useSavedRecipes: the on-device list is the source of truth for
 * display and works offline / as a guest; makes are pushed best-effort when signed
 * in, and anything that failed (offline) flushes on the next mount. Append-only, so
 * repeats accumulate. Photos are persisted locally the instant they're picked and
 * uploaded on the next flush, so a quit mid-upload loses nothing.
 * See docs/specs/2026-09-03-admin-outcomes.md.
 */
export function useCookLog() {
  const [entries, setEntries] = useState<CookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<CookEntry[]>([]);
  const flushing = useRef(false);

  const persist = useCallback((next: CookEntry[]) => {
    ref.current = next;
    setEntries(next);
    set(KEY, next);
  }, []);

  const patchEntry = useCallback((slug: string, madeAt: string, fn: (e: CookEntry) => CookEntry) => {
    persist(ref.current.map(e => (e.slug === slug && e.madeAt === madeAt ? fn(e) : e)));
  }, [persist]);

  // Push local state to the server. First upload any pending photos (a photo needs
  // a real url+publicId before the make can carry it), then push unsynced makes —
  // now including their photos. Single-flight so rapid taps can't double-push; a
  // failure (offline / logged out) leaves work pending for the next flush. Photos
  // require auth, so a guest flush just fails the uploads safely and pushes the make.
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      // 1) Upload pending photos, moving each onto its make as it lands.
      const keys = ref.current
        .filter(e => (e.pendingPhotos?.length ?? 0) > 0)
        .map(e => ({ slug: e.slug, madeAt: e.madeAt }));
      for (const k of keys) {
        // Drain this make's queue; success removes the head, failure stops (retry next flush).
        while (true) {
          const entry = ref.current.find(e => e.slug === k.slug && e.madeAt === k.madeAt);
          const head = entry?.pendingPhotos?.[0];
          if (!entry || !head) break;
          try {
            const { url, publicId } = await uploadsApi.uploadPhoto(head.localUri);
            patchEntry(k.slug, k.madeAt, e => ({
              ...e,
              synced: false, // photos changed → the make must re-push
              photos: [...(e.photos ?? []), { url, publicId, caption: head.caption ?? '', order: e.photos?.length ?? 0 }],
              pendingPhotos: (e.pendingPhotos ?? []).slice(1),
            }));
          } catch {
            patchEntry(k.slug, k.madeAt, e => ({
              ...e,
              pendingPhotos: (e.pendingPhotos ?? []).map((p, i) => (i === 0 ? { ...p, status: 'failed' as const } : p)),
            }));
            break;
          }
        }
      }

      // 2) Push unsynced makes (carrying any photos uploaded above). Drains in a loop
      //    so makes appended mid-push still go; only the exact batch is marked synced.
      while (true) {
        const pending = ref.current.filter(e => !e.synced);
        if (!pending.length) break;
        const batch = new Set(pending);
        await cookLogApi.record(pending.map(e => ({
          recipe: e.slug, madeAt: e.madeAt, rating: e.rating, note: e.note, photos: e.photos,
        })));
        persist(ref.current.map(e => (batch.has(e) ? { ...e, synced: true } : e)));
      }
    } catch { /* stays pending for the next flush */ } finally {
      flushing.current = false;
    }
  }, [persist, patchEntry]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = (await get<CookEntry[]>(KEY)) ?? [];
      if (!alive) return;
      ref.current = stored;
      setEntries(stored);
      setLoading(false);
      void flush();
    })();
    return () => { alive = false; };
  }, [flush]);

  /** Record a confirmed make; returns its madeAt — the key photos/rating attach to. */
  const recordMake = useCallback((slug: string, opts?: { rating?: number; note?: string }): string => {
    const madeAt = new Date().toISOString();
    const entry: CookEntry = {
      slug,
      madeAt,
      ...(opts?.rating ? { rating: opts.rating } : {}),
      ...(opts?.note ? { note: opts.note } : {}),
      synced: false,
    };
    persist([entry, ...ref.current]);
    void flush();
    return madeAt;
  }, [persist, flush]);

  /** Set/replace the rating on an existing make. */
  const rateMake = useCallback((slug: string, madeAt: string, rating: number) => {
    patchEntry(slug, madeAt, e => ({ ...e, rating, synced: false }));
    void flush();
  }, [patchEntry, flush]);

  /** Queue local photos on a make; they upload on the next flush. */
  const attachPhotos = useCallback((slug: string, madeAt: string, localUris: string[]) => {
    if (!localUris.length) return;
    patchEntry(slug, madeAt, e => ({
      ...e,
      synced: false,
      pendingPhotos: [
        ...(e.pendingPhotos ?? []),
        ...localUris.map(localUri => ({ localUri, status: 'pending' as const })),
      ],
    }));
    void flush();
  }, [patchEntry, flush]);

  /** Remove a photo — a not-yet-uploaded local one, or an uploaded one (destroys the asset). */
  const removePhoto = useCallback(async (
    slug: string, madeAt: string, target: { publicId?: string; localUri?: string },
  ) => {
    if (target.localUri) {
      patchEntry(slug, madeAt, e => ({
        ...e, pendingPhotos: (e.pendingPhotos ?? []).filter(p => p.localUri !== target.localUri),
      }));
      return;
    }
    if (target.publicId) {
      patchEntry(slug, madeAt, e => ({
        ...e, photos: (e.photos ?? []).filter(p => p.publicId !== target.publicId),
      }));
      try { await cookLogApi.deletePhoto({ recipe: slug, madeAt, publicId: target.publicId }); }
      catch { /* best-effort; the orphan sweep / a later delete cleans up */ }
    }
  }, [patchEntry]);

  const madeCount = useCallback((slug: string) => entries.filter(e => e.slug === slug).length, [entries]);

  const lastMade = useCallback((slug: string): string | null => {
    const times = entries.filter(e => e.slug === slug).map(e => e.madeAt).sort();
    return times.length ? times[times.length - 1] : null;
  }, [entries]);

  return { entries, loading, recordMake, rateMake, attachPhotos, removePhoto, madeCount, lastMade };
}

/** The shape returned by useCookLog — passed to child capture components so a
 *  screen shares one instance instead of forking a second local-state copy. */
export type UseCookLog = ReturnType<typeof useCookLog>;

/** Compact relative time for "last made" — "just now", "3d ago", "2 weeks ago". */
export function madeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d}d ago`;
  if (d < 60) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}
