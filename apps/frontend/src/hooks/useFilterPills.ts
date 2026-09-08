import { useCallback, useEffect, useRef, useState } from 'react';
import { api, tagsApi } from '../api';
import {
  FILTER_PILLS_FALLBACK, type FilterGroup, type FilterPill,
} from '../config/facets';

const GROUPS_FALLBACK: FilterGroup[] = [
  { code: 'effort',   label: 'Effort' },
  { code: 'taste',    label: 'Taste' },
  { code: 'occasion', label: 'Occasion' },
];

/**
 * Admin-owned Home filter-pill vocabulary. Fetches pills AND groups in a
 * single parallel request so they're always in sync. Returns { pills, groups,
 * reload } — call reload() from useFocusEffect to pick up admin changes each
 * time the user returns to the Home tab.
 *
 * Layout rule: the FIRST group (lowest order in the DB) renders as flat
 * one-tap pills; all other groups render as labelled dropdown buttons.
 * Admins control which group is first via the ↑↓ arrows in the GroupManager.
 */
export function useFilterPills(): {
  pills: FilterPill[];
  groups: FilterGroup[];
  reload: () => void;
} {
  const [pills,  setPills]  = useState<FilterPill[]>(FILTER_PILLS_FALLBACK);
  const [groups, setGroups] = useState<FilterGroup[]>(GROUPS_FALLBACK);
  const alive = useRef(true);

  const reload = useCallback(() => {
    Promise.all([
      tagsApi.list(),
      api.get<{ code: string; label: string; order: number }[]>('/api/filter-groups')
        .then(r => r.data),
    ])
      .then(([tagsData, groupsData]) => {
        if (!alive.current) return;

        // ── Groups ──────────────────────────────────────────────────────────
        // Sort by order so the admin's top group is always position 0 (flat).
        const sortedGroups = [...groupsData].sort((a, b) => a.order - b.order);
        if (sortedGroups.length) {
          setGroups(sortedGroups.map(g => ({ code: g.code, label: g.label })));
        }

        // ── Pills ───────────────────────────────────────────────────────────
        const raw: { code: string; label: string; group?: string }[] =
          tagsData?.filter ?? [];

        // Accept any group code that actually exists in the DB groups list,
        // so custom groups (beyond effort/taste/occasion) are never dropped.
        const knownCodes = new Set(sortedGroups.map(g => g.code));

        const mapped: FilterPill[] = raw
          .filter(p => p && typeof p.code === 'string' && p.group && knownCodes.has(p.group))
          .map(p => ({ code: p.code, label: p.label, group: p.group as string }));

        if (mapped.length) setPills(mapped);
      })
      .catch(() => { /* keep the fallback — offline or API down */ });
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, [reload]);

  return { pills, groups, reload };
}
