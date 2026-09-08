import { useCallback, useEffect, useRef, useState } from 'react';
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
 * Returns { pills, reload } — call reload() from useFocusEffect so admin
 * changes are reflected each time the user returns to the Home tab.
 */
export function useDietPills(): { pills: DietPill[]; reload: () => void } {
  const [pills, setPills] = useState<DietPill[]>(DIET_PILLS_FALLBACK);
  const alive = useRef(true);

  const reload = useCallback(() => {
    tagsApi.list()
      .then(data => {
        if (!alive.current) return;
        const raw = data?.diet ?? [];
        const mapped = raw
          .filter(p => p && typeof p.code === 'string' && typeof p.label === 'string')
          .map(p => ({ code: p.code, label: p.label }));
        if (mapped.length) setPills(mapped);
      })
      .catch(() => { /* keep the fallback */ });
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, [reload]);

  return { pills, reload };
}
