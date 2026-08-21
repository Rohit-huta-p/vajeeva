# Vajeeva Admin CMS — Implementation Plan (3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React + Vite admin SPA (recipe CMS) that admins use to create, edit, publish, and delete the 83 Vajeeva recipes via the `/api/admin/*` routes from Plan 1.

**Architecture:** Single-page app in `apps/admin/` of the existing monorepo. Access token lives in memory; refresh token is the httpOnly cookie the API sets. All requests go to same-origin `/api/*` — Vite proxies to the local API in dev, a Vercel rewrite proxies to Render in prod, so there is no CORS config and the `SameSite=strict` cookie keeps working. Recipe forms validate with the shared Zod `RecipeInputSchema` before submitting; the server stays the source of truth.

**Tech Stack:** React 18, Vite 5, TypeScript 5, React Router 6, TailwindCSS 4 (`@tailwindcss/vite`), Vitest + React Testing Library, `@vajeeva/shared` (Zod schemas from Plan 1)

**Spec:** `docs/specs/2026-08-17-vajeeva-rn-design.md` (§ Admin Panel). UX reference: `prototypes/vajeeva-admin-mockup.html` (visual guide only — the schema is the contract, see Self-Review).

**Assumes:** Plan 1 (`docs/superpowers/plans/2026-08-17-vajeeva-api.md`) is built: the monorepo root, `@vajeeva/shared`, and the API with `/api/auth/*` and `/api/admin/*` exist and pass their tests.

## Global Constraints

- Node ≥ 20.0.0, TypeScript strict mode (`"strict": true`)
- Admins only: login rejects `role !== 'admin'` client-side; the API's `requireAdmin` (403) is the real gate
- Access token: 15 min TTL, kept in a module variable only — never localStorage/sessionStorage. Refresh token: 30 day httpOnly cookie; every fetch uses `credentials: 'include'`
- On any 401, the client silently calls `POST /api/auth/refresh` once and retries; if refresh fails, the user lands on `/login`
- All API calls target same-origin `/api/*` (dev proxy + Vercel rewrite). Never hardcode an API host in app code
- Client-side validation = `RecipeInputSchema` from `@vajeeva/shared` before every POST/PUT (slug `/^[a-z0-9-]+$/`, `illColor` `/^#[0-9a-fA-F]{6}$/`, timer `MM:SS`, ≥1 ingredient, ≥1 step)
- No pagination — 83 recipes fits in one response (Plan 1 constraint)
- Runtime deps limited to: `react`, `react-dom`, `react-router-dom`, `@vajeeva/shared`. No axios, no react-query, no form library

---

## File Map

```
apps/admin/
├── package.json
├── tsconfig.json
├── vite.config.ts                 ← dev proxy /api → :4000, vitest config
├── vercel.json                    ← prod rewrite /api → Render API + SPA fallback
├── index.html
└── src/
    ├── main.tsx                   ← ReactDOM root
    ├── App.tsx                    ← router (all routes live here)
    ├── App.test.tsx
    ├── index.css                  ← Tailwind + Vajeeva palette tokens
    ├── auth.tsx                   ← RequireAuth protected-route wrapper
    ├── test/
    │   └── setup.ts               ← jest-dom matchers
    ├── api/
    │   ├── client.ts              ← token store + api() auto-refresh + RecipeDoc type
    │   └── client.test.ts
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── LoginPage.test.tsx
    │   ├── RecipeListPage.tsx     ← table + status filter (T3), publish toggle (T5), delete (T6)
    │   ├── RecipeListPage.test.tsx
    │   ├── RecipeEditorPage.tsx   ← create + edit modes (T4), preview column (T7)
    │   └── RecipeEditorPage.test.tsx
    └── components/
        ├── IngredientRows.tsx     ← T4
        ├── StepRows.tsx           ← T4
        ├── HealthFlagRows.tsx     ← T4
        ├── SourceRows.tsx         ← T4
        └── AppPreviewCard.tsx     ← T7
```

No root/monorepo changes needed — `apps/*` is already in the Yarn workspaces glob and Turborepo's generic `dev`/`build`/`test` tasks pick the new package up.

---

## Task 1: Vite + React Scaffold

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/vercel.json`
- Create: `apps/admin/index.html`
- Create: `apps/admin/src/index.css`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/test/setup.ts`
- Test: `apps/admin/src/App.test.tsx`

**Interfaces:**
- Consumes: monorepo root from Plan 1 Task 1 (Yarn workspaces + Turborepo)
- Produces: `@vajeeva/admin` workspace runnable via `cd apps/admin && yarn dev` / `yarn test` / `yarn build`; `App` component that Task 2 replaces with the router

- [ ] **Step 1: Create apps/admin/package.json**

```json
{
  "name": "@vajeeva/admin",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vajeeva/shared": "*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.1.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create apps/admin/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create apps/admin/vite.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

The `/api` proxy is what lets the httpOnly refresh cookie work in dev with zero CORS config: the browser only ever talks to the Vite origin.

- [ ] **Step 4: Create apps/admin/vercel.json**

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://vajeeva-api.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Same trick in prod: Vercel proxies `/api/*` to Render (adjust the hostname to the real Render URL at deploy time), and the second rewrite is the SPA fallback for deep links like `/recipes/:id/edit`.

- [ ] **Step 5: Create apps/admin/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vajeeva Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create apps/admin/src/index.css** (palette from the mockup's design tokens)

```css
@import "tailwindcss";

@theme {
  --color-cream: #FBF8F1;
  --color-bone: #F2EDE1;
  --color-sand: #E9E1D0;
  --color-ink: #2A251E;
  --color-brand: #3E6B4F;
  --color-brand-bg: #EBF2EE;
  --color-amber: #C6902F;
  --color-amber-bg: #FBF3E3;
  --color-clay: #B4472E;
}
```

- [ ] **Step 7: Create apps/admin/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 8: Create apps/admin/src/App.tsx** (placeholder shell — Task 2 replaces it with the router)

```tsx
export function App() {
  return <h1 className="p-6 font-serif text-xl text-ink">Vajeeva Admin</h1>;
}
```

- [ ] **Step 9: Create apps/admin/src/test/setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 10: Write the smoke test — apps/admin/src/App.test.tsx**

```tsx
import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the app shell', () => {
  render(<App />);
  expect(screen.getByText('Vajeeva Admin')).toBeInTheDocument();
});
```

- [ ] **Step 11: Install and run the test**

```bash
yarn install
cd apps/admin && yarn test
```

Expected: 1 test PASS. Also verify `yarn dev` starts and http://localhost:5173 shows "Vajeeva Admin", then stop it.

- [ ] **Step 12: Commit**

```bash
git add apps/admin/ yarn.lock
git commit -m "chore(admin): Vite + React + Tailwind scaffold with dev proxy and Vercel rewrites"
```

---

## Task 2: Auth — API Client, Login Page, Protected Routes

**Files:**
- Create: `apps/admin/src/api/client.ts`
- Create: `apps/admin/src/auth.tsx`
- Create: `apps/admin/src/pages/LoginPage.tsx`
- Modify: `apps/admin/src/App.tsx` — replace entirely with the router
- Test: `apps/admin/src/api/client.test.ts`
- Test: `apps/admin/src/pages/LoginPage.test.tsx`
- Modify: `apps/admin/src/App.test.tsx` — replace with a redirect test

**Interfaces:**
- Consumes: `POST /api/auth/login` → `{ accessToken }` + sets `refreshToken` cookie; `POST /api/auth/refresh` → `{ accessToken }` (Plan 1 Task 4). Access-token JWT payload is `{ userId: string; role: 'user' | 'admin' }`
- Produces (used by every later task):
  - `api<T>(path: string, init?: RequestInit): Promise<T>` — attaches `Authorization: Bearer`, auto-refreshes once on 401 then retries, throws `ApiError { status: number }` on failure
  - `setToken(token: string | null): void`, `getToken(): string | null`, `tryRefresh(): Promise<boolean>`, `tokenRole(): 'user' | 'admin' | null`
  - `type RecipeDoc` — a `Recipe` as the API returns it over JSON: `Omit<Recipe, 'createdAt' | 'updatedAt'> & { _id: string; createdAt: string; updatedAt: string }`
  - `RequireAuth` — layout route that silently refreshes on reload and redirects anonymous users to `/login`
  - Routes: `/login`; `/` protected (placeholder until Task 3)

- [ ] **Step 1: Write the failing client test — apps/admin/src/api/client.test.ts**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, setToken } from './client';

function jsonRes(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

describe('api()', () => {
  it('sends Authorization header when token set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setToken('abc');
    await api('/api/admin/recipes');
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
  });

  it('on 401, refreshes and retries once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes(401, { error: 'expired' }))
      .mockResolvedValueOnce(jsonRes(200, { accessToken: 'fresh' }))
      .mockResolvedValueOnce(jsonRes(200, [{ slug: 'x' }]));
    vi.stubGlobal('fetch', fetchMock);
    setToken('stale');
    const out = await api('/api/admin/recipes');
    expect(out).toEqual([{ slug: 'x' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
  });

  it('throws ApiError when refresh also fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonRes(401, { error: 'expired' }))
      .mockResolvedValueOnce(jsonRes(401, { error: 'no cookie' }));
    vi.stubGlobal('fetch', fetchMock);
    setToken('stale');
    await expect(api('/api/admin/recipes')).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/admin && yarn test src/api/client.test.ts
```

Expected: FAIL — `Cannot find module './client'` (or equivalent resolve error)

- [ ] **Step 3: Write apps/admin/src/api/client.ts**

```ts
import type { Recipe } from '@vajeeva/shared';

// A Recipe as the API returns it over JSON: Mongo _id, Date fields serialized.
export type RecipeDoc = Omit<Recipe, 'createdAt' | 'updatedAt'> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

// Access token lives in memory only (spec: never persisted client-side).
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

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(path, {
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
```

- [ ] **Step 4: Run the client test to verify it passes**

```bash
cd apps/admin && yarn test src/api/client.test.ts
```

Expected: 3 PASS

- [ ] **Step 5: Write the failing login + redirect tests**

`apps/admin/src/pages/LoginPage.test.tsx`:

```tsx
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { getToken, setToken } from '../api/client';

const adminJwt = 'h.' + btoa(JSON.stringify({ userId: 'u1', role: 'admin' })) + '.s';
const userJwt = 'h.' + btoa(JSON.stringify({ userId: 'u2', role: 'user' })) + '.s';

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

it('stores token and navigates home on admin login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ accessToken: adminJwt }), { status: 200 })
  ));
  renderLogin();
  await submit('admin@test.com', 'password123');
  expect(await screen.findByText('home')).toBeInTheDocument();
  expect(getToken()).toBe(adminJwt);
});

it('rejects non-admin login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ accessToken: userJwt }), { status: 200 })
  ));
  renderLogin();
  await submit('user@test.com', 'password123');
  expect(await screen.findByRole('alert')).toHaveTextContent('Admins only');
  expect(getToken()).toBeNull();
});

it('shows error on bad credentials', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
  ));
  renderLogin();
  await submit('admin@test.com', 'wrong-password');
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
});
```

Replace `apps/admin/src/App.test.tsx` entirely with:

```tsx
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { setToken } from './api/client';

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

it('redirects an unauthenticated visitor to login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'No refresh token' }), { status: 401 })
  ));
  render(<App />);
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run to verify they fail**

```bash
cd apps/admin && yarn test
```

Expected: FAIL — `Cannot find module './LoginPage'`

- [ ] **Step 7: Write LoginPage, RequireAuth, and the router**

`apps/admin/src/pages/LoginPage.tsx` (uses raw `fetch`, not `api()` — there is no token yet and a 401 here must not trigger the refresh loop):

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken, tokenRole } from '../api/client';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError('Invalid credentials');
      return;
    }
    const body = await res.json();
    setToken(body.accessToken);
    if (tokenRole() !== 'admin') {
      setToken(null);
      setError('Admins only');
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white border border-ink/20 rounded-lg p-8 w-80 space-y-4">
        <h1 className="font-serif text-xl font-semibold text-ink">Vajeeva Admin</h1>
        {error && <p role="alert" className="text-clay text-sm">{error}</p>}
        <label className="block text-xs font-semibold uppercase text-ink/55">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-ink/55">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
        <button type="submit" className="w-full bg-brand text-white rounded-lg py-2 text-sm font-medium">
          Sign in
        </button>
      </form>
    </main>
  );
}
```

`apps/admin/src/auth.tsx` — on a hard reload the in-memory token is gone but the refresh cookie survives, so try one silent refresh before bouncing to `/login`:

```tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken, tryRefresh } from './api/client';

export function RequireAuth() {
  const [state, setState] = useState<'checking' | 'ok' | 'anon'>(
    getToken() ? 'ok' : 'checking'
  );

  useEffect(() => {
    if (state !== 'checking') return;
    tryRefresh().then(ok => setState(ok ? 'ok' : 'anon'));
  }, [state]);

  if (state === 'checking') return <p className="p-6 text-ink/55">Loading…</p>;
  if (state === 'anon') return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

Replace `apps/admin/src/App.tsx` entirely with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './auth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<p className="p-6">Recipe list arrives in Task 3</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 8: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS (client, login, app redirect)

- [ ] **Step 9: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): auth — in-memory token client with auto-refresh, login page, protected routes"
```

---

## Task 3: Recipe List Page

**Files:**
- Create: `apps/admin/src/pages/RecipeListPage.tsx`
- Modify: `apps/admin/src/App.tsx` — mount at `/`
- Test: `apps/admin/src/pages/RecipeListPage.test.tsx`

**Interfaces:**
- Consumes: `api`, `RecipeDoc` from `../api/client`; `GET /api/admin/recipes` → `RecipeDoc[]` (all recipes incl. drafts)
- Produces: `RecipeListPage` at route `/` — table (name/slug/category/status), status filter, links to `/recipes/new` and `/recipes/:id/edit`. Tasks 5 and 6 add buttons to this page's Actions cell. No pagination (global constraint)

- [ ] **Step 1: Write the failing list tests — apps/admin/src/pages/RecipeListPage.test.tsx**

```tsx
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecipeListPage } from './RecipeListPage';
import { setToken } from '../api/client';

const RECIPES = [
  { _id: '1', slug: 'coconut-burfi', nameEn: 'Coconut Burfi', nameTa: 'தேங்காய் பர்ஃபி', category: 'semi-solid', status: 'published' },
  { _id: '2', slug: 'dates-ladoo', nameEn: 'Dates Ladoo', nameTa: '', category: 'solid', status: 'draft' },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setToken(null);
});

function renderList() {
  setToken('t');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify(RECIPES), { status: 200 })
  ));
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
}

it('renders one row per recipe with slug and status', async () => {
  renderList();
  expect(await screen.findByText('Coconut Burfi')).toBeInTheDocument();
  expect(screen.getByText('coconut-burfi')).toBeInTheDocument();
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
  expect(screen.getByText('published')).toBeInTheDocument();
  expect(screen.getByText('draft')).toBeInTheDocument();
});

it('filters by status', async () => {
  renderList();
  await screen.findByText('Coconut Burfi');
  await userEvent.selectOptions(screen.getByLabelText(/filter by status/i), 'draft');
  expect(screen.queryByText('Coconut Burfi')).not.toBeInTheDocument();
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/admin && yarn test src/pages/RecipeListPage.test.tsx
```

Expected: FAIL — `Cannot find module './RecipeListPage'`

- [ ] **Step 3: Write apps/admin/src/pages/RecipeListPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type RecipeDoc } from '../api/client';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

export function RecipeListPage() {
  const [recipes, setRecipes] = useState<RecipeDoc[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RecipeDoc[]>('/api/admin/recipes').then(setRecipes).catch(e => setError(e.message));
  }, []);

  if (!recipes) {
    return error
      ? <p role="alert" className="p-6 text-clay">{error}</p>
      : <p className="p-6 text-ink/55">Loading…</p>;
  }

  const visible = statusFilter === 'all' ? recipes : recipes.filter(r => r.status === statusFilter);

  return (
    <main className="min-h-screen bg-cream p-6">
      <header className="flex items-center gap-4 mb-6">
        <h1 className="font-serif text-xl font-semibold text-ink flex-1">Recipes</h1>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <Link to="/recipes/new" className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium">
          New Recipe
        </Link>
      </header>

      {error && <p role="alert" className="mb-4 text-clay text-sm">{error}</p>}

      <table className="w-full bg-white border border-ink/20 rounded-lg text-sm">
        <thead>
          <tr className="bg-bone text-left text-xs uppercase text-ink/55">
            <th className="px-4 py-2.5 font-semibold">Name</th>
            <th className="px-4 py-2.5 font-semibold">Slug</th>
            <th className="px-4 py-2.5 font-semibold">Category</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(r => (
            <tr key={r._id} className="border-t border-ink/10">
              <td className="px-4 py-3">
                <span className="font-serif font-semibold">{r.nameEn}</span>
                {r.nameTa && <span className="block text-xs text-ink/55">{r.nameTa}</span>}
              </td>
              <td className="px-4 py-3 text-ink/55">{r.slug}</td>
              <td className="px-4 py-3">{CATEGORY_LABEL[r.category]}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    r.status === 'published'
                      ? 'bg-brand-bg text-brand rounded-full px-2.5 py-0.5 text-xs'
                      : 'bg-amber-bg text-amber rounded-full px-2.5 py-0.5 text-xs'
                  }
                >
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link to={`/recipes/${r._id}/edit`} className="text-brand underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visible.length === 0 && <p className="p-4 text-ink/55">No recipes match this filter.</p>}
    </main>
  );
}
```

- [ ] **Step 4: Mount the route** — in `apps/admin/src/App.tsx`, add the import and replace the placeholder `/` route:

```tsx
import { RecipeListPage } from './pages/RecipeListPage';
// inside <Route element={<RequireAuth />}>:
<Route path="/" element={<RecipeListPage />} />
```

- [ ] **Step 5: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): recipe list page with status filter"
```

---

## Task 4: Recipe Editor — Create + Edit Modes

**Files:**
- Create: `apps/admin/src/components/IngredientRows.tsx`
- Create: `apps/admin/src/components/StepRows.tsx`
- Create: `apps/admin/src/components/HealthFlagRows.tsx`
- Create: `apps/admin/src/components/SourceRows.tsx`
- Create: `apps/admin/src/pages/RecipeEditorPage.tsx`
- Modify: `apps/admin/src/App.tsx` — mount `/recipes/new` and `/recipes/:id/edit`
- Test: `apps/admin/src/pages/RecipeEditorPage.test.tsx`

**Interfaces:**
- Consumes: `RecipeInputSchema`, `type RecipeInput` from `@vajeeva/shared`; `api`, `RecipeDoc` from `../api/client`; `GET /api/admin/recipes`, `POST /api/admin/recipes` (create), `PUT /api/admin/recipes/:id` (full replace)
- Produces:
  - `RecipeEditorPage` — create mode at `/recipes/new` (no `:id` param), edit mode at `/recipes/:id/edit`. Covers every `RecipeInput` field. "Save draft" / "Publish" buttons set `status` (this is the status toggle)
  - Section components, all with the same contract `{ value: X[]; onChange(next: X[]): void }`: `IngredientRows`, `StepRows` (also exports `EMPTY_STEP: RecipeInput['steps'][number]`), `HealthFlagRows`, `SourceRows`
  - Task 7 consumes the page's `form: RecipeInput` state for the live preview

- [ ] **Step 1: Write the failing editor tests — apps/admin/src/pages/RecipeEditorPage.test.tsx**

```tsx
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RecipeEditorPage } from './RecipeEditorPage';
import { setToken } from '../api/client';

const DOC = {
  _id: 'r1',
  slug: 'coconut-burfi',
  nameEn: 'Coconut Burfi',
  nameTa: '',
  category: 'semi-solid',
  description: 'Sweet.',
  ingredients: [{ nameEn: 'Coconut', quantityG: '50 g', quantityCup: '¼ cup' }],
  steps: [{ order: 1, text: 'Cook it.', phase: 'Main', heat: null, timerStr: null, stepIngredients: [], illColor: '#2A3828' }],
  healthFlags: [],
  sources: [],
  yieldStr: '4 pieces',
  shelfLife: '5 days',
  status: 'draft',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
});

function renderCreate() {
  render(
    <MemoryRouter initialEntries={['/recipes/new']}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeEditorPage />} />
        <Route path="/" element={<p>list</p>} />
      </Routes>
    </MemoryRouter>
  );
}

it('create mode: Publish posts a valid RecipeInput with status published', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Ragi Malt');
  await userEvent.type(screen.getByLabelText(/^slug$/i), 'ragi-malt');
  await userEvent.type(screen.getByLabelText(/ingredient 1 name/i), 'Ragi');
  await userEvent.type(screen.getByLabelText(/step 1 text/i), 'Boil it.');
  await userEvent.click(screen.getByRole('button', { name: /publish/i }));

  expect(await screen.findByText('list')).toBeInTheDocument();
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/admin/recipes');
  expect(init.method).toBe('POST');
  const body = JSON.parse(init.body);
  expect(body.slug).toBe('ragi-malt');
  expect(body.status).toBe('published');
  expect(body.steps[0].order).toBe(1);
});

it('create mode: invalid slug shows a validation error and sends nothing', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Bad Slug');
  await userEvent.type(screen.getByLabelText(/^slug$/i), 'Bad Slug!');
  await userEvent.type(screen.getByLabelText(/ingredient 1 name/i), 'X');
  await userEvent.type(screen.getByLabelText(/step 1 text/i), 'Y');
  await userEvent.click(screen.getByRole('button', { name: /publish/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('slug');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('edit mode: loads the recipe and PUTs on save', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([DOC]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(
    <MemoryRouter initialEntries={['/recipes/r1/edit']}>
      <Routes>
        <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
        <Route path="/" element={<p>list</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByDisplayValue('Coconut Burfi')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
  expect(await screen.findByText('list')).toBeInTheDocument();
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/r1');
  expect(init.method).toBe('PUT');
  expect(JSON.parse(init.body).status).toBe('draft');
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/admin && yarn test src/pages/RecipeEditorPage.test.tsx
```

Expected: FAIL — `Cannot find module './RecipeEditorPage'`

- [ ] **Step 3: Write apps/admin/src/components/IngredientRows.tsx**

```tsx
import type { RecipeInput } from '@vajeeva/shared';

type Ingredient = RecipeInput['ingredients'][number];

export function IngredientRows({ value, onChange }: {
  value: Ingredient[];
  onChange: (next: Ingredient[]) => void;
}) {
  const set = (i: number, patch: Partial<Ingredient>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Ingredients</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Ingredient ${i + 1} name`}
            placeholder="Name"
            value={row.nameEn}
            onChange={e => set(i, { nameEn: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Ingredient ${i + 1} grams`}
            placeholder="40–50 g"
            value={row.quantityG}
            onChange={e => set(i, { quantityG: e.target.value })}
            className="w-28 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Ingredient ${i + 1} cups`}
            placeholder="¼ cup"
            value={row.quantityCup}
            onChange={e => set(i, { quantityCup: e.target.value })}
            className="w-28 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove ingredient ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { nameEn: '', quantityG: '', quantityCup: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add ingredient
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 4: Write apps/admin/src/components/StepRows.tsx**

Reordering uses ↑/↓ buttons and renumbers `order` on every change; `illColor` uses the native `<input type="color">`; `stepIngredients` is a comma-separated text field with an exact `join(',')`/`split(',')` round-trip so typing never fights the cursor — blanks are trimmed at save time by the page.

```tsx
import type { RecipeInput } from '@vajeeva/shared';

type Step = RecipeInput['steps'][number];

export const EMPTY_STEP: Step = {
  order: 1,
  text: '',
  phase: '',
  heat: null,
  timerStr: null,
  stepIngredients: [],
  illColor: '#2A3828',
};

export function StepRows({ value, onChange }: {
  value: Step[];
  onChange: (next: Step[]) => void;
}) {
  const emit = (next: Step[]) => onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  const set = (i: number, patch: Partial<Step>) =>
    emit(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const [row] = next.splice(i, 1);
    next.splice(i + dir, 0, row);
    emit(next);
  };

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Cook Steps</legend>
      {value.map((row, i) => (
        <div key={i} className="bg-bone border border-ink/20 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
              {i + 1}
            </span>
            <button type="button" aria-label={`Move step ${i + 1} up`} disabled={i === 0}
              onClick={() => move(i, -1)} className="px-1 disabled:opacity-30">↑</button>
            <button type="button" aria-label={`Move step ${i + 1} down`} disabled={i === value.length - 1}
              onClick={() => move(i, 1)} className="px-1 disabled:opacity-30">↓</button>
            <span className="flex-1" />
            <button type="button" aria-label={`Remove step ${i + 1}`}
              onClick={() => emit(value.filter((_, j) => j !== i))} className="text-clay px-2">×</button>
          </div>
          <textarea
            aria-label={`Step ${i + 1} text`}
            placeholder="What to do in this step…"
            value={row.text}
            onChange={e => set(i, { text: e.target.value })}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm mb-2"
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              aria-label={`Step ${i + 1} phase`}
              placeholder="Phase (e.g. Milk & Coconut)"
              value={row.phase}
              onChange={e => set(i, { phase: e.target.value })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <input
              aria-label={`Step ${i + 1} heat`}
              placeholder="Heat (blank = none)"
              value={row.heat ?? ''}
              onChange={e => set(i, { heat: e.target.value || null })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <input
              aria-label={`Step ${i + 1} timer`}
              placeholder="Timer MM:SS (blank = none)"
              value={row.timerStr ?? ''}
              onChange={e => set(i, { timerStr: e.target.value || null })}
              className="border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-ink/55">
              Illustration color
              <input
                aria-label={`Step ${i + 1} illustration color`}
                type="color"
                value={row.illColor}
                onChange={e => set(i, { illColor: e.target.value })}
              />
            </label>
          </div>
          <input
            aria-label={`Step ${i + 1} ingredients`}
            placeholder="Step ingredients, comma,separated"
            value={row.stepIngredients.join(',')}
            onChange={e => set(i, { stepIngredients: e.target.value.split(',') })}
            className="w-full border border-ink/20 rounded-lg px-3 py-2 bg-white text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => emit([...value, EMPTY_STEP])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add step
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 5: Write apps/admin/src/components/HealthFlagRows.tsx**

```tsx
import type { RecipeInput } from '@vajeeva/shared';

type HealthFlag = RecipeInput['healthFlags'][number];

export function HealthFlagRows({ value, onChange }: {
  value: HealthFlag[];
  onChange: (next: HealthFlag[]) => void;
}) {
  const set = (i: number, patch: Partial<HealthFlag>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Health Flags</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Flag ${i + 1} condition`}
            placeholder="Condition (e.g. diabetes)"
            value={row.condition}
            onChange={e => set(i, { condition: e.target.value })}
            className="w-40 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <select
            aria-label={`Flag ${i + 1} severity`}
            value={row.severity}
            onChange={e => set(i, { severity: e.target.value as HealthFlag['severity'] })}
            className="border border-ink/20 rounded-lg px-2 py-2 bg-bone text-sm"
          >
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="avoid">Avoid</option>
          </select>
          <input
            aria-label={`Flag ${i + 1} note`}
            placeholder="Note"
            value={row.note}
            onChange={e => set(i, { note: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove flag ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { condition: '', severity: 'caution', note: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add health flag
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 6: Write apps/admin/src/components/SourceRows.tsx**

```tsx
import type { RecipeInput } from '@vajeeva/shared';

type Source = RecipeInput['sources'][number];

export function SourceRows({ value, onChange }: {
  value: Source[];
  onChange: (next: Source[]) => void;
}) {
  const set = (i: number, patch: Partial<Source>) =>
    onChange(value.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
      <legend className="text-xs font-bold uppercase text-ink/55 px-1">Sources</legend>
      {value.map((row, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            aria-label={`Source ${i + 1} text`}
            placeholder="Source (e.g. Ksemakutuhalam)"
            value={row.text}
            onChange={e => set(i, { text: e.target.value })}
            className="flex-1 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <input
            aria-label={`Source ${i + 1} citation`}
            placeholder="Citation (e.g. 10/54)"
            value={row.citation}
            onChange={e => set(i, { citation: e.target.value })}
            className="w-32 border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm"
          />
          <button
            type="button"
            aria-label={`Remove source ${i + 1}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="text-clay px-2"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { text: '', citation: '' }])}
        className="border border-dashed border-ink/20 rounded-lg w-full py-2 text-sm text-ink/55"
      >
        + Add source
      </button>
    </fieldset>
  );
}
```

- [ ] **Step 7: Write apps/admin/src/pages/RecipeEditorPage.tsx**

```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RecipeInputSchema, type RecipeInput } from '@vajeeva/shared';
import { api, type RecipeDoc } from '../api/client';
import { IngredientRows } from '../components/IngredientRows';
import { StepRows, EMPTY_STEP } from '../components/StepRows';
import { HealthFlagRows } from '../components/HealthFlagRows';
import { SourceRows } from '../components/SourceRows';

const EMPTY_RECIPE: RecipeInput = {
  slug: '',
  nameEn: '',
  nameTa: '',
  category: 'solid',
  description: '',
  ingredients: [{ nameEn: '', quantityG: '', quantityCup: '' }],
  steps: [EMPTY_STEP],
  healthFlags: [],
  sources: [],
  yieldStr: '',
  shelfLife: '',
  status: 'draft',
};

export function RecipeEditorPage() {
  const { id } = useParams(); // undefined → create mode
  const navigate = useNavigate();
  const [form, setForm] = useState<RecipeInput | null>(id ? null : EMPTY_RECIPE);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    // ponytail: no GET /:id on the admin API — list+find is fine at 83 recipes;
    // add a single-recipe route when the list outgrows one response
    api<RecipeDoc[]>('/api/admin/recipes')
      .then(all => {
        const doc = all.find(r => r._id === id);
        if (!doc) {
          setError('Recipe not found');
          return;
        }
        const { _id, createdAt, updatedAt, ...input } = doc;
        setForm(input);
      })
      .catch(e => setError(e.message));
  }, [id]);

  async function save(status: RecipeInput['status']) {
    if (!form) return;
    const cleaned: RecipeInput = {
      ...form,
      status,
      steps: form.steps.map(s => ({
        ...s,
        stepIngredients: s.stepIngredients.map(x => x.trim()).filter(Boolean),
      })),
    };
    const parsed = RecipeInputSchema.safeParse(cleaned);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(`${first.path.join('.')}: ${first.message}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await api(`/api/admin/recipes/${id}`, { method: 'PUT', body: JSON.stringify(parsed.data) });
      } else {
        await api('/api/admin/recipes', { method: 'POST', body: JSON.stringify(parsed.data) });
      }
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return error
      ? <p role="alert" className="p-6 text-clay">{error}</p>
      : <p className="p-6 text-ink/55">Loading…</p>;
  }

  return (
    <main className="min-h-screen bg-cream p-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-ink/55 text-sm">← All Recipes</Link>
        <h1 className="font-serif text-xl font-semibold text-ink flex-1">
          {id ? 'Edit Recipe' : 'New Recipe'}
        </h1>
        <button
          type="button"
          disabled={saving}
          onClick={() => save('draft')}
          className="border border-ink/20 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => save('published')}
          className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Publish
        </button>
      </header>

      {error && <p role="alert" className="mb-4 text-clay text-sm">{error}</p>}

      <fieldset className="bg-white border border-ink/20 rounded-lg p-5 mb-4">
        <legend className="text-xs font-bold uppercase text-ink/55 px-1">Basic Info</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Name (English)
            <input
              value={form.nameEn}
              onChange={e => setForm({ ...form, nameEn: e.target.value })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone font-serif text-base normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Name (Tamil)
            <input
              value={form.nameTa}
              onChange={e => setForm({ ...form, nameTa: e.target.value })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone font-serif text-base normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Slug
            <input
              value={form.slug}
              placeholder="coconut-burfi"
              onChange={e => setForm({ ...form, slug: e.target.value })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Category
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as RecipeInput['category'] })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
            >
              <option value="solid">Solid</option>
              <option value="liquid">Liquid</option>
              <option value="semi-solid">Semi-solid</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Yield
            <input
              value={form.yieldStr}
              placeholder="3–4 laddoos"
              onChange={e => setForm({ ...form, yieldStr: e.target.value })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
            />
          </label>
          <label className="block text-xs font-semibold uppercase text-ink/55">
            Shelf life
            <input
              value={form.shelfLife}
              placeholder="5–7 days"
              onChange={e => setForm({ ...form, shelfLife: e.target.value })}
              className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
            />
          </label>
        </div>
        <label className="block text-xs font-semibold uppercase text-ink/55 mt-3">
          Description
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full border border-ink/20 rounded-lg px-3 py-2 bg-bone text-sm normal-case"
          />
        </label>
      </fieldset>

      <IngredientRows value={form.ingredients} onChange={ingredients => setForm({ ...form, ingredients })} />
      <StepRows value={form.steps} onChange={steps => setForm({ ...form, steps })} />
      <HealthFlagRows value={form.healthFlags} onChange={healthFlags => setForm({ ...form, healthFlags })} />
      <SourceRows value={form.sources} onChange={sources => setForm({ ...form, sources })} />
    </main>
  );
}
```

- [ ] **Step 8: Mount the routes** — in `apps/admin/src/App.tsx`, add the import and two routes inside `<Route element={<RequireAuth />}>` after the `/` route:

```tsx
import { RecipeEditorPage } from './pages/RecipeEditorPage';
// inside <Route element={<RequireAuth />}>:
<Route path="/recipes/new" element={<RecipeEditorPage />} />
<Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
```

- [ ] **Step 9: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): recipe editor — create/edit modes covering all RecipeSchema fields with shared Zod validation"
```

---

## Task 5: Publish / Unpublish with Optimistic UI

**Files:**
- Modify: `apps/admin/src/pages/RecipeListPage.tsx`
- Test: `apps/admin/src/pages/RecipeListPage.test.tsx` (append)

**Interfaces:**
- Consumes: `PATCH /api/admin/recipes/:id` body `{ status: 'published' | 'draft' }` → updated `Recipe` (Plan 1 Task 7)
- Produces: per-row Publish/Unpublish button on `RecipeListPage`; the row's status flips immediately and reverts (with an error banner) if the PATCH fails

- [ ] **Step 1: Append the failing toggle tests to apps/admin/src/pages/RecipeListPage.test.tsx**

```tsx
it('publish toggle PATCHes and flips the badge optimistically', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/2');
  expect(init.method).toBe('PATCH');
  expect(JSON.parse(init.body)).toEqual({ status: 'published' });
  expect(screen.getAllByText('published')).toHaveLength(2);
});

it('reverts the status when the PATCH fails', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'boom' }), { status: 500 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  expect(screen.getAllByText('draft')).toHaveLength(1);
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/admin && yarn test src/pages/RecipeListPage.test.tsx
```

Expected: FAIL — no button with accessible name "Publish"

- [ ] **Step 3: Add the handler and button to RecipeListPage.tsx**

Add inside the `RecipeListPage` function, after the `visible` line:

```tsx
  async function toggleStatus(r: RecipeDoc) {
    const next = r.status === 'published' ? ('draft' as const) : ('published' as const);
    const prev = recipes!;
    setError(null);
    setRecipes(prev.map(x => (x._id === r._id ? { ...x, status: next } : x)));
    try {
      await api(`/api/admin/recipes/${r._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
    } catch (e) {
      setRecipes(prev); // optimistic write failed — put the old list back
      setError((e as Error).message);
    }
  }
```

In the Actions cell, add the toggle button before the Edit link:

```tsx
              <td className="px-4 py-3 space-x-3">
                <button type="button" onClick={() => toggleStatus(r)} className="text-brand underline">
                  {r.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <Link to={`/recipes/${r._id}/edit`} className="text-brand underline">Edit</Link>
              </td>
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): publish/unpublish toggle with optimistic update and revert on failure"
```

---

## Task 6: Delete Recipe with Confirmation

**Files:**
- Modify: `apps/admin/src/pages/RecipeListPage.tsx`
- Test: `apps/admin/src/pages/RecipeListPage.test.tsx` (append)

**Interfaces:**
- Consumes: `DELETE /api/admin/recipes/:id` → `{ ok: true }` (Plan 1 Task 7)
- Produces: per-row Delete button gated by `window.confirm` (the native confirmation dialog — no modal component needed); the row disappears on success

- [ ] **Step 1: Append the failing delete tests to apps/admin/src/pages/RecipeListPage.test.tsx**

Add `waitFor` to the existing `@testing-library/react` import, then:

```tsx
it('deletes after confirm and removes the row', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/admin/recipes/2');
  expect(init.method).toBe('DELETE');
  await waitFor(() => expect(screen.queryByText('Dates Ladoo')).not.toBeInTheDocument());
});

it('does nothing when the confirm is cancelled', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(RECIPES), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  setToken('t');
  render(<MemoryRouter><RecipeListPage /></MemoryRouter>);
  await screen.findByText('Dates Ladoo');
  await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Dates Ladoo')).toBeInTheDocument();
});
```

(The file's `afterEach` from Task 3 already calls `vi.restoreAllMocks()`, which undoes the `confirm` spy.)

- [ ] **Step 2: Run to verify they fail**

```bash
cd apps/admin && yarn test src/pages/RecipeListPage.test.tsx
```

Expected: FAIL — no button with accessible name "Delete"

- [ ] **Step 3: Add the handler and button to RecipeListPage.tsx**

Add after `toggleStatus`:

```tsx
  async function remove(r: RecipeDoc) {
    if (!window.confirm(`Delete "${r.nameEn}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api(`/api/admin/recipes/${r._id}`, { method: 'DELETE' });
      setRecipes(rs => rs!.filter(x => x._id !== r._id));
    } catch (e) {
      setError((e as Error).message);
    }
  }
```

In the Actions cell, add after the Edit link:

```tsx
                <button type="button" onClick={() => remove(r)} className="text-clay underline">
                  Delete
                </button>
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): delete recipe with native confirm dialog"
```

---

## Task 7: App Preview Card in the Editor

**Files:**
- Create: `apps/admin/src/components/AppPreviewCard.tsx`
- Modify: `apps/admin/src/pages/RecipeEditorPage.tsx` — two-column layout with sticky preview
- Test: `apps/admin/src/pages/RecipeEditorPage.test.tsx` (append)

**Interfaces:**
- Consumes: the editor's live `form: RecipeInput` state (Task 4)
- Produces: `AppPreviewCard({ recipe: RecipeInput })` — read-only card approximating the mobile recipe card (spec § Admin Panel: "App preview card"), shown beside the form on wide screens

- [ ] **Step 1: Append the failing preview test to apps/admin/src/pages/RecipeEditorPage.test.tsx**

Add `within` to the existing `@testing-library/react` import, then:

```tsx
it('live-previews the recipe name as you type', async () => {
  vi.stubGlobal('fetch', vi.fn());
  setToken('t');
  renderCreate();
  await userEvent.type(screen.getByLabelText(/name \(english\)/i), 'Ragi Malt');
  const preview = screen.getByRole('complementary', { name: /app preview/i });
  expect(within(preview).getByText('Ragi Malt')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd apps/admin && yarn test src/pages/RecipeEditorPage.test.tsx
```

Expected: FAIL — no element with role "complementary"

- [ ] **Step 3: Write apps/admin/src/components/AppPreviewCard.tsx**

```tsx
import type { RecipeInput } from '@vajeeva/shared';

const CATEGORY_LABEL = { solid: 'Solid', liquid: 'Liquid', 'semi-solid': 'Semi-solid' } as const;

export function AppPreviewCard({ recipe }: { recipe: RecipeInput }) {
  return (
    <aside aria-label="App preview" className="bg-white border border-ink/20 rounded-xl overflow-hidden shadow-md">
      <div
        className="h-32 flex items-end p-3"
        style={{ backgroundColor: recipe.steps[0]?.illColor ?? '#2A3828' }}
      >
        <span className="font-serif font-semibold text-white drop-shadow">
          {recipe.nameEn || 'Untitled recipe'}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          <span className="bg-bone text-ink/55 rounded px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[recipe.category]}
          </span>
          {recipe.healthFlags.filter(f => f.severity === 'safe').slice(0, 1).map(f => (
            <span key={f.condition} className="bg-brand-bg text-brand rounded px-2 py-0.5 text-xs">
              {f.condition}
            </span>
          ))}
        </div>
        <p className="text-xs text-ink/55 leading-relaxed">{recipe.description}</p>
        <p className="text-xs text-ink/55">
          {recipe.steps.length} steps · shelf life {recipe.shelfLife || '—'}
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Add the preview column to RecipeEditorPage.tsx**

Add the import:

```tsx
import { AppPreviewCard } from '../components/AppPreviewCard';
```

Widen the page: change the `<main>` className from `max-w-3xl` to `max-w-5xl`.

Wrap the form content in a grid. Immediately after the error banner line (`{error && <p role="alert" …>}`), open the grid and left column; the Basic Info fieldset and the four `*Rows` components stay exactly as written in Task 4 inside the left column; then close with the preview column:

```tsx
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-5 lg:items-start">
        <div>
          {/* Basic Info fieldset + IngredientRows + StepRows + HealthFlagRows + SourceRows, unchanged from Task 4 */}
        </div>
        <div className="lg:sticky lg:top-6 mt-4 lg:mt-0">
          <AppPreviewCard recipe={form} />
        </div>
      </div>
```

- [ ] **Step 5: Run all tests to verify they pass**

```bash
cd apps/admin && yarn test
```

Expected: all PASS

- [ ] **Step 6: Final commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): live app-preview card in the editor — Plan 3 complete"
```

---

## Self-Review

**Spec coverage (spec § Admin Panel + task brief):**
- ✅ React + Vite SPA on Vercel, admins only — Task 1 scaffold, Task 2 role gate, `vercel.json` deploy config
- ✅ Auth: login page, JWT in memory + refresh cookie, protected routes, auto-refresh on 401 and on reload — Task 2
- ✅ Recipe list with slug/name/category/status and published/draft filter — Task 3
- ✅ Full recipe editor, every `RecipeSchema` input field: `slug`, `nameEn`, `nameTa`, `category`, `description`, `ingredients[]` (nameEn/quantityG/quantityCup), `steps[]` (order auto-numbered, text, phase, heat, timerStr, stepIngredients, illColor via native color picker), `healthFlags[]` (condition/severity/note), `sources[]` (text/citation), `yieldStr`, `shelfLife`, `status` — Task 4
- ✅ Create + Edit modes — Task 4 (`/recipes/new`, `/recipes/:id/edit`)
- ✅ Publish/draft toggle — editor "Save draft"/"Publish" buttons (Task 4) + list-row PATCH toggle with optimistic UI (Task 5)
- ✅ Delete with confirmation — Task 6 (`window.confirm`, the native dialog)
- ✅ App preview card — Task 7
- ✅ No pagination, no search, no user-management UI — per spec's out-of-scope list

**Deliberately not built from the mockup** (the mockup is a UX reference; the schema and spec are the contract):
- Dashboard view, category filter tabs, search box, Users/Health-Flags nav items — spec lists search and user management as out of scope; dashboard adds nothing for a 2-person team
- "Texture" select — no such field exists in `RecipeSchema`
- Drag-to-reorder steps — ↑/↓ buttons give the same capability without a drag library
- Standalone publish toggle switch in a side card — the Save draft / Publish buttons already set status

**Type consistency:**
- `api<T>`, `setToken`, `getToken`, `tryRefresh`, `tokenRole`, `ApiError`, `RecipeDoc` defined once in Task 2 `client.ts`; consumed with those exact names in Tasks 3–6 ✅
- Section components all share `{ value: X[]; onChange(next: X[]): void }`; `EMPTY_STEP` defined and exported in `StepRows.tsx`, consumed by `EMPTY_RECIPE` in Task 4 ✅
- `RecipeInputSchema` / `RecipeInput` match Plan 1 Task 2's shared package exports ✅
- Route paths `/`, `/login`, `/recipes/new`, `/recipes/:id/edit` consistent across App.tsx, links, and tests ✅

**Known simplifications (each marked or noted inline):**
- Edit mode loads the full list and `find`s by id — the admin API has no `GET /:id` (`ponytail:` comment in Task 4)
- `stepIngredients` is a comma-separated text input, trimmed/filtered at save — chips UI when an ingredient legitimately needs a comma
- Errors surface as a single first-issue banner from Zod — per-field inline errors when the admin asks

**No placeholders.** Every step has runnable code or an exact anchor into code defined earlier in this plan.
