import { syncedAgo } from '../src/offline/format';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

test('syncedAgo renders human-friendly freshness, and guards bad input', () => {
  expect(syncedAgo(null)).toBe('not yet synced');
  expect(syncedAgo('not-a-date')).toBe('not yet synced');
  expect(syncedAgo(ago(5_000))).toBe('just now');            // < 45s
  expect(syncedAgo(ago(5 * 60_000))).toBe('5m ago');
  expect(syncedAgo(ago(3 * 3_600_000))).toBe('3h ago');
  expect(syncedAgo(ago(2 * 86_400_000))).toBe('2d ago');
  expect(syncedAgo(ago(3 * 7 * 86_400_000))).toBe('3w ago');
});
