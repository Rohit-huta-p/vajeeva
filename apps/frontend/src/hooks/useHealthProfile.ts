import { useEffect, useState, useCallback } from 'react';
import { api, getAccessToken } from '../api';
import * as storage from '../offline/storage';

const KEY = 'healthProfile';

// Single source of truth for the user's active condition codes.
//   • the local store is authoritative — it drives the "Safe for me" filter and
//     works offline and as a guest;
//   • the server PATCH is best-effort write-through, only when signed in.
// There is no GET /users/me, so the profile is never read back from the server.
export function useHealthProfile() {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    storage.get<string[]>(KEY)
      .then(v => { if (alive) setCodes(Array.isArray(v) ? v : []); })
      .catch(() => { /* corrupt / missing — treat as empty */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const save = useCallback(async (next: string[]) => {
    setCodes(next);                                    // optimistic; local is truth
    await storage.set(KEY, next).catch(() => {});
    if (getAccessToken()) {                             // signed-in only — guests skip
      await api.patch('/api/users/me', { healthProfile: next }).catch(() => {});
    }
  }, []);

  return { codes, loading, save };
}
