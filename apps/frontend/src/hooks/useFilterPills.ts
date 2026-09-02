import { useEffect, useState } from 'react';
import { tagsApi } from '../api';
import {
  FILTER_GROUPS, FILTER_PILLS_FALLBACK, type FilterGroup, type FilterPill,
} from '../config/facets';

/**
 * The admin-owned Home filter-pill vocabulary (the `filter` facet of GET /api/tags).
 * Starts from the bundled fallback so the row renders on first paint / offline,
 * then swaps in the live vocab once it loads. Only items with a known group are
 * kept. See docs/specs/2026-09-02-home-filter-pills.md.
 */
export function useFilterPills(): FilterPill[] {
  const [pills, setPills] = useState<FilterPill[]>(FILTER_PILLS_FALLBACK);

  useEffect(() => {
    let alive = true;
    tagsApi.list()
      .then(data => {
        if (!alive) return;
        const raw = data?.filter ?? [];
        const mapped = raw
          .filter(p => p && typeof p.code === 'string' && FILTER_GROUPS.includes(p.group as FilterGroup))
          .map(p => ({ code: p.code, label: p.label, group: p.group as FilterGroup }));
        if (mapped.length) setPills(mapped);
      })
      .catch(() => { /* keep the fallback */ });
    return () => { alive = false; };
  }, []);

  return pills;
}
