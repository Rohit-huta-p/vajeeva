import { useState, useEffect, useRef, useCallback } from 'react';
import { get, set } from '../offline/storage';
import { diaryApi } from '../api/recipes';
import { localYMD, type MealSlot } from '../lib/localDay';

const KEY = 'diary';

export type Adherence = 'followed' | 'partial' | 'deviated';

export interface DiaryEntry {
  date: string;            // patient-local 'YYYY-MM-DD'
  adherence?: Adherence;
  remarks?: string;
  synced?: boolean;
}

/**
 * The daily dietary check-in (per-day adherence + remarks). Local-first like
 * useCookLog: written on-device, pushed best-effort, retried on the next mount.
 * One entry per local day (re-answering the same day updates it).
 * See docs/specs/2026-09-20-dietary-diary.md.
 */
export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const ref = useRef<DiaryEntry[]>([]);
  const flushing = useRef(false);

  const persist = useCallback((next: DiaryEntry[]) => {
    ref.current = next;
    setEntries(next);
    set(KEY, next);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (true) {
        const pending = ref.current.filter(e => !e.synced);
        if (!pending.length) break;
        const batch = new Set(pending);
        await diaryApi.record(pending.map(e => ({ date: e.date, adherence: e.adherence, remarks: e.remarks })));
        persist(ref.current.map(e => (batch.has(e) ? { ...e, synced: true } : e)));
      }
    } catch { /* stays pending for the next flush */ } finally {
      flushing.current = false;
    }
  }, [persist]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = (await get<DiaryEntry[]>(KEY)) ?? [];
      if (!alive) return;
      ref.current = stored;
      setEntries(stored);
      void flush();
    })();
    return () => { alive = false; };
  }, [flush]);

  /** Today's entry, if the patient has already checked in. */
  const today = useCallback((): DiaryEntry | undefined => {
    const t = localYMD();
    return entries.find(e => e.date === t);
  }, [entries]);

  /** Record (or update) today's adherence + optional remarks. */
  const setToday = useCallback((adherence: Adherence, remarks?: string) => {
    const date = localYMD();
    const prev = ref.current.find(e => e.date === date);
    const entry: DiaryEntry = { date, adherence, remarks: remarks ?? prev?.remarks ?? '', synced: false };
    persist([entry, ...ref.current.filter(e => e.date !== date)]);
    void flush();
  }, [persist, flush]);

  return { entries, today, setToday };
}

export type { MealSlot };
