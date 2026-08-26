import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage-backed (Expo Go compatible — MMKV needs native modules Expo Go
// can't load). All operations are Promise-based; hooks load persisted state
// into React state once, then persist on mutation.

export async function get<T>(key: string): Promise<T | null> {
  const v = await AsyncStorage.getItem(key);
  if (!v) return null;
  try { return JSON.parse(v) as T; } catch { return null; }
}

/** Batch read; result is keyed by input key, missing/corrupt entries omitted. */
export async function getMany<T>(keys: string[]): Promise<Record<string, T>> {
  if (keys.length === 0) return {};
  const pairs = await AsyncStorage.multiGet(keys);
  const out: Record<string, T> = {};
  for (const [key, v] of pairs) {
    if (!v) continue;
    try { out[key] = JSON.parse(v) as T; } catch { /* skip corrupt entry */ }
  }
  return out;
}

export async function set<T>(key: string, val: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(val));
}

export async function del(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
