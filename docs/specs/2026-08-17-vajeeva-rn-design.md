# Vajeeva — React Native App Design
**Date:** 2026-08-17  
**Stack:** React Native (Expo) · Express · MongoDB · React (admin web)  
**Status:** Approved design — pending implementation plan

---

## Context

Vajeeva is an Ayurvedic recipe app with 83 recipes across Solid / Liquid / Semi-solid categories. Recipes include cook mode (step-by-step with timers), health flags / contraindications, classical source citations, and ingredient tables with unit toggling.

**Team:** 2 people — developer + client (admin).  
**Platforms:** iOS + Android.  
**Key constraint:** App must work fully offline; accounts are required for sync.

---

## Architecture: Monorepo (Approach A)

```
vajeeva/
├── apps/
│   ├── mobile/          ← React Native (Expo managed workflow)
│   ├── api/             ← Express + TypeScript + Mongoose
│   └── admin/           ← React + Vite (recipe CMS)
├── packages/
│   └── shared/          ← Zod schemas, TS types, constants
├── package.json         ← Yarn workspaces
└── turbo.json           ← Turborepo
```

**Why:** Clean separation, shared types prevent API/client drift, admin web is better UX for recipe editing than mobile.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile | React Native + Expo | Managed workflow, OTA updates |
| Offline DB | WatermelonDB | Fast, native SQLite, built for RN |
| API | Express + TypeScript | REST |
| Database | MongoDB Atlas | Free tier for early stage |
| Admin web | React + Vite | Same language as mobile |
| Auth | JWT (access + refresh) | Stateless, works offline |
| API hosting | Render | Free tier |
| Admin hosting | Vercel | Free tier |

---

## Data Models

### User
```ts
{
  _id: ObjectId
  email: string
  passwordHash: string
  role: 'user' | 'admin'
  lastSyncAt: Date        // sync cursor
  createdAt: Date
}
```

### Recipe
```ts
{
  _id: ObjectId
  slug: string            // "coconut-burfi"
  nameEn: string
  nameTa: string
  category: 'solid' | 'liquid' | 'semi-solid'
  description: string
  ingredients: Array<{
    nameEn: string
    quantityG: string     // "40–50 g"
    quantityCup: string   // "¼ cup"
  }>
  steps: Array<{
    order: number
    text: string
    phase: string         // "Milk & Coconut"
    heat: string | null   // "Low heat" | null
    timerStr: string | null  // "08:00" | null
    stepIngredients: string[]  // chips shown in cook mode
    illColor: string      // hex, cook mode background
  }>
  healthFlags: Array<{
    condition: string     // "diabetes", "pregnancy", etc.
    severity: 'safe' | 'caution' | 'avoid'
    note: string
  }>
  sources: Array<{ text: string; citation: string }>
  yieldStr: string        // "3–4 laddoos"
  shelfLife: string       // "5–7 days"
  status: 'published' | 'draft'
  updatedAt: Date         // sync cursor — pull where updatedAt > lastSyncAt
  createdAt: Date
}
```

**Design decision:** Health flags are inline per recipe (not a separate collection). 83 recipes, one admin — normalisation is premature.

### SavedRecipe
```ts
{
  _id: ObjectId
  userId: ObjectId
  recipeId: ObjectId
  savedAt: Date
}
```

---

## API Endpoints

### Auth
```
POST /api/auth/register     { email, password }
POST /api/auth/login        { email, password } → { accessToken, refreshToken }
POST /api/auth/refresh      { refreshToken }    → { accessToken }
```

### Public / User
```
GET /api/recipes                 ?category=solid&status=published
GET /api/recipes/:slug           full recipe
GET /api/sync/recipes            ?since=<iso>   delta sync
GET /api/sync/saved              user's saved list        [auth]
POST /api/sync/saved             { added:[id], removed:[id] }  [auth]
```

### Admin only
```
GET    /api/admin/recipes        all incl. drafts
POST   /api/admin/recipes        create
PUT    /api/admin/recipes/:id    full replace
PATCH  /api/admin/recipes/:id    partial update (e.g. status toggle)
DELETE /api/admin/recipes/:id
```

**Auth middleware:** `requireAuth` (valid JWT), `requireAdmin` (role === 'admin', 403 otherwise).

---

## Auth Flow

- **Access token:** JWT, 15 min TTL, sent in `Authorization: Bearer` header.
- **Refresh token:** JWT, 30 days TTL, httpOnly cookie.
- **RN storage:** access token in memory only (not SecureStore — latency). On 401 → auto-refresh interceptor → retry.
- **Offline:** WatermelonDB works without auth. Token only gates sync and saved-list endpoints. Users can browse cached recipes fully offline without re-authenticating.

---

## Offline Sync Strategy

**Server is always source of truth for recipe content.**

### Pull (server → client)
```
1. Read lastSyncAt from local store (AsyncStorage)
2. GET /api/sync/recipes?since=lastSyncAt
3. Upsert returned recipes into WatermelonDB
4. Write lastSyncAt = now
```

Runs on: app foreground, login, manual pull-to-refresh.

### First install (no account)
Bundle ~10 featured recipes as seed JSON, included at build time. Full pull on first login.

### Push (client → server)
```
Save tap → optimistic write to WatermelonDB
         → POST /api/sync/saved in background
         → if offline: queue in AsyncStorage, flush on reconnect
```

### Conflict resolution
Recipe content: `updatedAt` wins — server version always replaces local on next sync. No user-editable recipe fields, so no merge needed.  
Saved list: additive (add/remove IDs). No destructive conflict possible.

**No CRDTs, no vector clocks.** Intentionally simple for this scale.

---

## Admin Panel

- **URL:** `vajeeva-admin.vercel.app` (React + Vite, separate Vercel deployment)
- **Auth:** Same JWT, role check on all `/api/admin/*` routes
- **Features:**
  - Recipe list with published/draft filter
  - Full recipe editor: name (en + ta), category, ingredients, cook steps (with heat/timer per step), health flags, sources, yield, shelf life
  - Publish / draft toggle
  - App preview card (shows how recipe looks in mobile app)
- **User management:** None needed — set `role: 'admin'` directly in MongoDB Atlas UI for the second admin. Two people, no invite UI required yet.

---

## What's Out of Scope (This Version)

- Push notifications
- Recipe ratings / comments
- Search (full-text) — filter by category is enough for 83 recipes
- In-app user management UI
- Pagination — 83 recipes fits in one sync pull

---

## Open Questions (resolved)

| Question | Decision |
|---|---|
| Accounts required? | Yes — plus full offline support (local-first) |
| Platforms | iOS + Android |
| Recipe editing | Admin only (no user-generated content) |
| Admin team size | 2 (developer + client) — no roles UI needed |
| Health flags structure | Inline per recipe (not normalised) |
