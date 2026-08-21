import axios from 'axios';
import Constants from 'expo-constants';

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
  register: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken?: string }>('/api/auth/register', { email, password }),
  refresh: (rt: string) =>
    api.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken: rt }),
};

export const recipesApi = {
  list: (category?: string) =>
    api.get<any[]>('/api/recipes', { params: category ? { category } : undefined }).then(r => r.data),
  detail: (slug: string) => api.get<any>(`/api/recipes/${slug}`).then(r => r.data),
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
