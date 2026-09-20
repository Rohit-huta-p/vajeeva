import type { Recipe } from '@vajeepurna/shared';

export type RecipeDoc = Omit<Recipe, 'createdAt' | 'updatedAt'> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

export function tokenRole(): 'user' | 'admin' | null {
  if (!accessToken) return null;
  try {
    return JSON.parse(atob(accessToken.split('.')[1])).role;
  } catch {
    return null;
  }
}

export async function tryRefresh(): Promise<boolean> {
  const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) return false;
  const body = await res.json();
  setToken(body.accessToken);
  return true;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// In production the admin is a static bundle — Vite's dev proxy is gone, so
// relative `/api` calls would hit the admin's own host. VITE_API_URL points
// them at the real backend (e.g. https://vajeeva-backend.onrender.com).
const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

  let res = await doFetch();
  if (res.status === 401 && (await tryRefresh())) {
    res = await doFetch();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      typeof body.error === 'string' ? body.error : `Request failed (${res.status})`
    );
  }
  return res.json();
}
