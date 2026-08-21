import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

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
  list: () => api.get<any[]>('/api/recipes').then(r => r.data),
  detail: (slug: string) => api.get<any>(`/api/recipes/${slug}`).then(r => r.data),
};
