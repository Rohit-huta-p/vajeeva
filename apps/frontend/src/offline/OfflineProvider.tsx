import React, {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { hydrateCatalog, syncCatalog, getMeta } from './catalog';

// Drives the offline catalog: hydrate the on-device cache at boot (so the app is
// usable before any network), track connectivity, and sync (full replace) on
// launch and whenever connectivity returns. Screens read the catalog snapshot
// synchronously via catalog.ts; this provider only exposes status + a manual
// resync, and the OfflineBadge reads `isOnline`.

type SyncPhase = 'idle' | 'syncing' | 'done' | 'error';

interface OfflineState {
  /** true once the persisted catalog is loaded into memory (safe to render). */
  ready: boolean;
  isOnline: boolean;
  syncPhase: SyncPhase;
  lastSyncedAt: string | null;
  /** Force a full re-pull (e.g. a "Update now" control). No-op while syncing. */
  resync: () => void;
}

const OfflineContext = createContext<OfflineState>({
  ready: false, isOnline: true, syncPhase: 'idle', lastSyncedAt: null, resync: () => {},
});

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncPhase, setSyncPhase] = useState<SyncPhase>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncing = useRef(false);
  const prevOnline = useRef(true);

  const doSync = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    setSyncPhase('syncing');
    try {
      await syncCatalog();
      const meta = await getMeta();
      setLastSyncedAt(meta.lastSyncedAt);
      setSyncPhase('done');
    } catch {
      // Offline or server error — the cached catalog stays valid and readable.
      setSyncPhase('error');
    } finally {
      syncing.current = false;
    }
  }, []);

  // Boot: load the cache into memory first (instant, offline), publish it, then
  // kick a best-effort sync. A sync failure never blocks the app.
  useEffect(() => {
    let alive = true;
    (async () => {
      await hydrateCatalog().catch(() => {});
      const meta = await getMeta().catch(() => ({ lastSyncedAt: null }));
      if (!alive) return;
      setLastSyncedAt(meta.lastSyncedAt);
      setReady(true);
      doSync();
    })();
    return () => { alive = false; };
  }, [doSync]);

  // Track connectivity; re-sync on every offline→online transition.
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const online = state.isConnected !== false; // unknown/null → treat as online
      setIsOnline(online);
      if (!prevOnline.current && online) doSync();
      prevOnline.current = online;
    });
    return () => unsub();
  }, [doSync]);

  return (
    <OfflineContext.Provider value={{ ready, isOnline, syncPhase, lastSyncedAt, resync: doSync }}>
      {children}
    </OfflineContext.Provider>
  );
}
