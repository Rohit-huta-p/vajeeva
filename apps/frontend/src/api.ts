import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On a physical device 'localhost' is the phone itself, so default to the
// Metro host the device already connected to (its LAN IP), port 4000.
// EXPO_PUBLIC_API_URL stays the highest-priority override; web/simulator
// (no hostUri, or a localhost one) falls back to localhost.
const hostUri: string | undefined =
  Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
const lanHost = hostUri?.split(':')[0];
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (lanHost ? `http://${lanHost}:4000` : 'http://localhost:4000');

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(t: string | null) { accessToken = t; }
export function getAccessToken() { return accessToken; }
export function setRefreshToken(t: string | null) { refreshToken = t; }
export function getRefreshToken() { return refreshToken; }

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) throw err;
    original._retry = true;
    try {
      if (!refreshToken) throw new Error('no refresh token');
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      setAccessToken(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      setAccessToken(null);
      setRefreshToken(null);
      throw err;
    }
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/login', { email, password }),
  register: (
    email: string, password: string,
    extra?: { name?: string; phone?: string; age?: number; gender?: string },
  ) =>
    api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/register', { email, password, ...extra }),
  refresh: (rt: string) =>
    api.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken: rt }),
};

export const recipesApi = {
  list: (category?: string) =>
    api.get<any[]>('/api/recipes', { params: category ? { category } : undefined }).then(r => r.data),
  detail: (slug: string) => api.get<any>(`/api/recipes/${slug}`).then(r => r.data),
  // Free-text search (name/ingredient/description; fuzzy + diacritic-folded
  // server-side — see apps/api/src/routes/recipes.routes.ts). Blank q short-
  // circuits to [] server-side, so callers don't need to guard against it.
  search: (q: string) => api.get<any[]>('/api/recipes/search', { params: { q } }).then(r => r.data),
};

export const tagsApi = {
  // Public discovery vocab, grouped by facet. Home reads the `filter` group for
  // its pills. See docs/specs/2026-09-02-home-filter-pills.md.
  list: () =>
    api.get<Record<string, { code: string; label: string; group?: string }[]>>('/api/tags').then(r => r.data),
};

export const subrecipesApi = {
  list: () => api.get<any[]>('/api/subrecipes').then(r => r.data),
  detail: (slug: string) => api.get<any>(`/api/subrecipes/${slug}`).then(r => r.data),
};

export const sourcesApi = {
  list: () => api.get<any[]>('/api/sources').then(r => r.data),
  detail: (slug: string) => api.get<any>(`/api/sources/${slug}`).then(r => r.data),
};

export const savedApi = {
  // GET /api/sync/saved returns a bare string[] of recipe ids.
  list: () => api.get<string[]>('/api/sync/saved').then(r => r.data ?? []),
  push: (added: string[], removed: string[]) =>
    api.post('/api/sync/saved', { added, removed }),
};

export interface PhotoRef { url: string; publicId: string; caption?: string; order?: number }
export interface CookMake { recipe: string; madeAt?: string; rating?: number; note?: string; photos?: PhotoRef[]; slot?: 'morning' | 'afternoon' | 'night'; localDate?: string }
export interface CookLogEntry { slug: string; madeAt: string; rating: number | null; note: string; photos: PhotoRef[]; slot: 'morning' | 'afternoon' | 'night' | null; localDate: string | null }

export const cookLogApi = {
  // Append-only "I made this" log. Client batches makes (offline makes flush
  // together). See docs/specs/2026-09-03-admin-outcomes.md.
  list: () => api.get<CookLogEntry[]>('/api/sync/cooked').then(r => r.data ?? []),
  record: (makes: CookMake[]) => api.post('/api/sync/cooked', { makes }),
  // Remove one prepared-dish photo, owner-scoped. See docs/specs/2026-09-09-prepared-photos.md.
  deletePhoto: (p: { recipe: string; madeAt: string; publicId: string }) =>
    api.delete('/api/sync/cooked/photo', { data: p }),
};

export interface DiaryDayInput { date: string; adherence?: string; remarks?: string }
export interface DiaryDayEntry { date: string; adherence: 'followed' | 'partial' | 'deviated' | null; remarks: string }

export const diaryApi = {
  // Per-day adherence + remarks; offline-batched like makes. See docs/specs/2026-09-20-dietary-diary.md.
  list: () => api.get<DiaryDayEntry[]>('/api/sync/diary').then(r => r.data ?? []),
  record: (days: DiaryDayInput[]) => api.post('/api/sync/diary', { days }),
};

// Prepared-dish photo upload (patient). React Native multipart differs from the
// web File API — the file part is { uri, name, type }. Returns the stored URL + id.
export const uploadsApi = {
  // Raw XHR (not axios) on purpose: React Native only fills in the
  // `multipart/form-data; boundary=…` header when we DON'T set Content-Type
  // ourselves. axios forcing a boundary-less `multipart/form-data` makes the
  // server parse no file (400 "No file uploaded"). XHR also gives real upload
  // progress. Auth token is attached manually since we bypass the axios interceptor.
  uploadPhoto: async (
    uri: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ url: string; publicId: string }> => {
    const name = uri.split('/').pop() || 'dish.jpg';
    const form = new FormData();
    if (Platform.OS === 'web') {
      // Web FormData needs a real Blob — RN's { uri, name, type } shape isn't a file.
      const blob = await fetch(uri).then(r => r.blob());
      form.append('file', blob, name);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append('file', { uri, name, type: 'image/jpeg' } as any);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/uploads`);
      const token = getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // NB: intentionally no Content-Type header — RN adds it with the boundary.

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error('Bad upload response')); }
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(form);
    });
  },
};

export const usersApi = {
  // Permanently delete the signed-in account + its saved recipes (204).
  deleteMe: () => api.delete('/api/users/me'),
};
