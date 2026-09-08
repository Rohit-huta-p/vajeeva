import { useCallback, useEffect, useRef, useState } from 'react';
import { tagsApi } from '../api';
import {
  FILTER_PILLS_FALLBACK, type FilterGroup, type FilterPill,
} from '../config/facets';

/**
 * The admin-owned Home filter-pill vocabulary (the `filter` facet of GET /api/tags).
 * Starts from the bundled fallback so the row renders on first paint / offline,
 * then swaps in the live vocab once it loads.
 *
 * Returns { pills, groups, reload } — call reload() from useFocusEffect to
 * pick up admin changes each time the user returns to the Home tab.
 * See docs/specs/2026-09-02-home-filter-pills.md.
 */
export function useFilterPills(): {
  pills: FilterPill[];
  groups: FilterGroup[];
  reload: () => void;
} {
  const [pills, setPills] = useState<FilterPill[]>(FILTER_PILLS_FALLBACK);
  // Live group list (codes + labels) sourced from GET /api/filter-groups,
  // so the dropdown labels reflect admin renames without a native rebuild.
  const [groups, setGroups] = useState<FilterGroup[]>([
    { code: 'effort',   label: 'Effort' },
    { code: 'taste',    label: 'Taste' },
    { code: 'occasion', label: 'Occasion' },
  ]);
  const alive = useRef(true);

  const reload = useCallback(() => {
    tagsApi.list()
      .then(data => {
        if (!alive.current) return;
        const raw: { code: string; label: string; group?: string }[] = data?.filter ?? [];
        if (raw.length === 0) return;

        // Collect all group codes actually present in the API data.
        const knownCodes = new Set(raw.map(p => p.group).filter(Boolean) as string[]);

        const mapped: FilterPill[] = raw
          .filter(p => p && typeof p.code === 'string' && p.group && knownCodes.has(p.group))
          .map(p => ({ code: p.code, label: p.label, group: p.group as string }));

        if (mapped.length) setPills(mapped);

        // Fetch live group labels from the filter-groups endpoint so renames
        // in the admin panel are reflected without an app rebuild.
        import('../api').then(({ api }) =>
          api.get<{ code: string; label: string; order: number }[]>('/api/filter-groups')
            .then(res => {
              if (!alive.current) return;
              const sorted = [...res.data].sort((a, b) => a.order - b.order);
              if (sorted.length) setGroups(sorted.map(g => ({ code: g.code, label: g.label })));
            })
            .catch(() => {})
        );
      })
      .catch(() => { /* keep the fallback */ });
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, [reload]);

  return { pills, groups, reload };
}
