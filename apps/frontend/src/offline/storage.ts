import { createMMKV } from 'react-native-mmkv';

const store = createMMKV({ id: 'vajeeva' });

export function get<T>(key: string): T | null {
  const v = store.getString(key);
  if (!v) return null;
  try { return JSON.parse(v) as T; } catch { return null; }
}

export function set<T>(key: string, val: T): void {
  store.set(key, JSON.stringify(val));
}

export function del(key: string): void {
  store.remove(key);
}
