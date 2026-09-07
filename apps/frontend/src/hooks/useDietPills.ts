import { useEffect, useState } from 'react';
import { tagsApi } from '../api';

export interface DietPill { code: string; label: string; }

// Shown while /api/tags is loading or if offline.
const DIET_PILLS_FALLBACK: DietPill[] = [
  { code: 'veg',          label: 'Veg' },
  { code: 'dairy-free',   label: 'Dairy-free' },
  { code: 'gluten-free',  label: 'Gluten-free' },
  { code: 'sweet',        label: 'Sweet' },
  { code: 'high-protein', label: 'High protein' },
];

/**
 * Admin-owned diet-tag pills sourced from the `diet` facet of GET /api/tags.
 * Falls back to a hardcoded list so the row renders on first paint / offline.
 */
export function useDietPills(): DietPill[] {
  const [pills, setPills] = useState<DietPill[]>(DIET_PILLS_FALLBACK);

  useEffect(() => {
    let alive = true;
    tagsApi.list()
      .then(data => {
        if (!alive) return;
        const raw = data?.diet ?? [];
        const mapped = raw
          .filter(p => p && typeof p.code === 'string' && typeof p.label === 'string')
          .map(p => ({ code: p.code, label: p.label }));
        if (mapped.length) setPills(mapped);
      })
      .catch(() => { /* keep the fallback */ });
    return () => { alive = false; };
  }, []);

  return pills;
}
