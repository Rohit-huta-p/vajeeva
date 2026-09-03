import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set } from '../offline/storage';
import { cookLogApi } from '../api/recipes';

const KEY = 'cooklog';

export interface CookEntry {
  slug: string;
  madeAt: string;   // ISO
  rating?: number;  // 1–5, optional
  note?: string;
  synced?: boolean; // false until the server has accepted it
}

/**
 * The "I made this" log — the engagement + satisfaction anchor.
 *
 * Local-first like useSavedRecipes: the on-device list is the source of truth
 * for display and works offline / as a guest; makes are pushed best-effort when
 * signed in, and any that failed (offline) flush on the next mount. Append-only,
 * so repeats accumulate — repeat makes are the cadence signal.
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

  // Push unsynced makes and mark them synced on success. Single-flight (guarded)
  // so rapid taps can't double-push; drains in a loop so makes that arrive during
  // a push still go; only the exact pushed batch is marked (a make appended mid-
  // push stays pending). A failure (offline / logged out) leaves them for next time.
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (true) {
        const pending = ref.current.filter(e => !e.synced);
        if (!pending.length) break;
        const batch = new Set(pending);
        await cookLogApi.record(
          pending.map(e => ({ recipe: e.slug, madeAt: e.madeAt, rating: e.rating, note: e.note })),
        );
        persist(ref.current.map(e => (batch.has(e) ? { ...e, synced: true } : e)));
      }
    } catch { /* stays pending for the next flush */ } finally {
      flushing.current = false;
    }
  }, [persist]);

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

  const recordMake = useCallback((slug: string, opts?: { rating?: number; note?: string }) => {
    const entry: CookEntry = {
      slug,
      madeAt: new Date().toISOString(),
      ...(opts?.rating ? { rating: opts.rating } : {}),
      ...(opts?.note ? { note: opts.note } : {}),
      synced: false,
    };
    persist([entry, ...ref.current]);
    void flush();
  }, [persist, flush]);

  const madeCount = useCallback((slug: string) => entries.filter(e => e.slug === slug).length, [entries]);

  const lastMade = useCallback((slug: string): string | null => {
    const times = entries.filter(e => e.slug === slug).map(e => e.madeAt).sort();
    return times.length ? times[times.length - 1] : null;
  }, [entries]);

  return { entries, loading, recordMake, madeCount, lastMade };
}

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
