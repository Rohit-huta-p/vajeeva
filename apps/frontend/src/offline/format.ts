// Human-friendly "time since last sync" for freshness labels. App runtime code,
// so Date is available (unlike the workflow sandbox).
export function syncedAgo(iso: string | null): string {
  if (!iso) return 'not yet synced';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'not yet synced';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${Math.floor(day / 7)}w ago`;
}
