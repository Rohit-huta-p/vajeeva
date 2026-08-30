# Offline-first with full download — implementation spec

**Status:** implemented — phases 0–2 + 4 (merged to `main` via PR #7); phase 3 (freshness UI) pending · **Date:** 2026-08-27
**Problem:** the app is online-dependent for all recipe content. List / detail / search / sources
fetch straight through axios with no cache (`apps/frontend/src/api.ts`); only *saved* recipes and
local UI state survive offline. Worse, a signed-in user who opens the app **offline is logged out** —
launch calls `authApi.refresh()` and any failure hits the `catch` that deletes the stored session
(`apps/frontend/src/auth/AuthContext.tsx:37`), so `AuthGate` bounces them to `/auth/opening` with no
way back in. **Goal:** the entire cookbook — recipe text **and** the one header photo per recipe — is
fully usable with zero network, syncing whenever a connection is available.

**Design stance:**
- **Local-first** — the on-device cache is the source screens read from; the network only feeds the
  *sync engine*. Screens never `await` the API on the render path.
- **Full download, not lazy** — on the first online session, pull the whole catalog + every header
  image; keep in sync thereafter. (Cache-on-view is explicitly rejected.)
- **Reuse what exists** — the backend `GET /api/sync/recipes?since=` delta endpoint
  (`apps/api/src/routes/sync.routes.ts:10`), the `offline/storage.ts` KV wrapper,
  `@react-native-community/netinfo` (installed, unused), and `OfflineBadge` (built, unwired).
- **Expo Go compatible** — AsyncStorage for text, `expo-file-system` for image files. Both ship in
  Expo Go; no custom native modules, no MMKV (which the codebase already notes Expo Go can't load,
  `offline/storage.ts:3`).

**Corpus assumptions:** ~100 recipes, uniform schema, **1 header photo each**. Text ≈ **0.5 MB** total;
images ≈ **15–35 MB** total (100 × one `w_1080,q_auto,f_auto` rendition). Both trivial for the chosen
storage — no SQLite needed at this scale; a full re-pull stays sub-1 MB, so we favour **full-replace
sync** (which also handles unpublish/delete correctly) and keep `?since=` as a future optimization.

---

## 0. Offline-safe launch (auth) — *critical prerequisite*

`AuthContext` must not destroy the session on a *network* failure, only on a real auth rejection.

In `apps/frontend/src/auth/AuthContext.tsx`, the launch effect (currently lines 37–59):

```ts
if (session?.refreshToken) {
  try {
    const { data } = await authApi.refresh(session.refreshToken);
    setAccessToken(data.accessToken);
    setRefreshToken(session.refreshToken);
    setUser({ email: session.email, name: session.name, age: session.age, gender: session.gender });
  } catch (err) {
    // 401/invalid_grant → the refresh token is truly dead: clear it.
    // Network error (offline) → keep the session; hydrate identity from storage
    // and seed the refresh token so the axios 401-interceptor recovers online.
    if (isAuthError(err)) {
      await storage.del('session').catch(() => {});
    } else {
      setRefreshToken(session.refreshToken);
      setUser({ email: session.email, name: session.name, age: session.age, gender: session.gender });
    }
  }
}
```

`isAuthError(err)` = `axios.isAxiosError(err) && err.response?.status === 401`. No response object ⇒
network/offline ⇒ keep the user signed in against the cache. **Guests are already offline-safe** (the
`guest` flag path needs no network).

---

## 1. Catalog cache + repository (text)

The whole published catalog lives on-device; screens read it synchronously from memory.

**`apps/frontend/src/offline/catalog.ts` (new)**
- `syncCatalog()` — **`GET /api/recipes`** (full pull; `?since=` deferred). Uses the *public* list
  endpoint, not the auth-gated `/api/sync/recipes`, because it must work for **guests** too — and the
  list already returns full `Recipe.find().lean()` docs (`recipes.routes.ts:7`), so one endpoint powers
  list, detail, and search offline. Writes each doc to `recipe:{slug}`, replaces `catalog:index` (slug
  list), stamps `catalog:meta = { lastSyncedAt }`. Reconciles deletions: any `recipe:{slug}` / image
  whose slug left the index is purged.
- `hydrateCatalog()` — load `catalog:index` + all `recipe:{slug}` into an in-memory map at boot
  (instant, offline). This is what screens read.
- `getAllRecipes(): RecipeDoc[]`, `getRecipe(slug): RecipeDoc | undefined` — synchronous reads.
- `searchCatalog(q): RecipeDoc[]` — client-side over the in-memory map: match `nameEn` / `nameTa` /
  `ingredients[].nameEn` / `description`, diacritic-folded to mirror the server’s fuzzy search
  (`apps/api/src/routes/recipes.routes.ts`). At 100 items a linear scan is instant.

**Screen swaps** — replace live API calls with cache reads (network moves entirely into the sync engine):
- `HomeScreen` texture counts (currently `recipesApi.list()` at line 79) → derive from `getAllRecipes()`.
- `RecipeListScreen` list + facet filter → `getAllRecipes()` + existing `matchFacet`.
- `RecipeDetailScreen` / `cook` / `finish` → `getRecipe(slug)`; header fallback for an unsynced slug.
- `SearchBar` submit → `searchCatalog(q)` (drop the `/api/recipes/search` round-trip; use it as an
  online-only enhancement later if fuzzy quality diverges).
- Saved (`useSavedRecipes`) is unchanged — it already reads `saved:{slug}` from storage.

`sources` / `subrecipes` get the same treatment if they must work offline (mirror `catalog.ts`).

---

## 2. Full image download (files)

**New dependency:** `expo-file-system` (add to `apps/frontend/package.json`; `expo-image` optional, see §9).

**`apps/frontend/src/offline/images.ts` (new)**
- Dir: `${FileSystem.documentDirectory}recipe-images/` — **documentDirectory**, not `cacheDirectory`
  (iOS purges Caches under storage pressure and would silently break the offline guarantee). Mark the
  folder excluded-from-iCloud-backup so re-downloadable files don’t bloat backups.
- Canonical rendition: one file per recipe, `cloudDownloadUrl(url)` = a `w_1080,q_auto,f_auto` variant
  of `cloudThumb` (`apps/frontend/src/api/recipes.ts:94`). One asset per recipe; cards reuse it (RN
  `Image` downsamples) — no per-size duplication.
- `syncImages(recipes)` — for each recipe’s header (`sortImages(doc.images)[0]`): if `img:{slug}`
  is missing **or** its stored `sourceUrl` ≠ the recipe’s current header URL → `downloadAsync` to
  `recipe-images/{slug}`, then set `img:{slug} = { sourceUrl, localUri }`. Cloudinary URLs carry a
  version/public-id, so a replaced photo changes the URL ⇒ natural cache-busting. Slugs gone from the
  catalog → delete file + manifest entry (GC). Concurrency-limit to ~4.
- `hydrateImageManifest()` — load all `img:*` into an in-memory map at boot (for synchronous render).

**Render choke point** — one helper threads every image site:
```ts
// imageSource(slug, remoteUrl, w, h) → { uri: localUri ?? cloudThumb(remoteUrl, w, h) }
```
Swap `source={{ uri: cloudThumb(url, w, h) }}` → `source={imageSource(slug, url, w, h)}` at the 7 sites:
`RecipeDetailScreen`, `SavedScreen`, `CookModeScreen`, `ImageCarousel`, `RecipeGridCard`,
`PickUpRail`, `ContinueCookingCard`. Offline the local file is used; online-but-unsynced falls back to
the remote thumb, so nothing ever renders broken.

---

## 3. Sync orchestration + connectivity

**`apps/frontend/src/offline/OfflineProvider.tsx` (new)** — mounts under `AuthProvider` in
`app/_layout.tsx`.
- **Boot:** `hydrateCatalog()` + `hydrateImageManifest()` → app is fully interactive offline before any
  network check.
- **Connectivity:** `NetInfo.addEventListener` → `isOnline`.
- **Sync:** when online at boot and on every offline→online transition, run `syncCatalog()` then
  `syncImages()`; track `syncState = { phase: 'idle'|'catalog'|'images'|'done'|'error', done, total,
  lastSyncedAt }`.
- **Context/hooks:** `useOffline()` → `{ isOnline, syncState, resync() }`; `useCatalog()` →
  `{ recipes, getRecipe, search }`. Screens consume these instead of `recipesApi`.

---

## 4. Freshness + storage surface

The health angle makes staleness matter (recipes carry `healthFlags` contraindications):
- Wire the existing `OfflineBadge` to `!isOnline` in the header(s).
- On `RecipeDetailScreen`, a muted “Updated {relative(lastSyncedAt)}” line; if `lastSyncedAt` is older
  than N days while online, nudge a resync.
- **Settings → Offline** (optional at this size): “Downloaded ✓ · {n} recipes · {MB}”, “Update now”
  (`resync()`), “Clear downloads”. Compute MB from the image dir.

---

## 5. Backend

Mostly already in place. The client's full-replace pull uses the public `GET /api/recipes`
(guest-compatible, full docs); `GET /api/sync/recipes?since=` (`sync.routes.ts:10`) returns published
lean docs and is reserved for a future signed-in delta; saved push/pull merge exists (`/api/sync/saved`).
- **Now:** no change required for a full-replace client.
- **Later (optimization, only if the corpus grows):** a lightweight `GET /api/sync/manifest` →
  `[{ slug, updatedAt, imageUrl }]` so the client can diff without pulling full bodies, plus tombstones
  to make `?since=` deletion-safe. Not needed at ~100 recipes.

---

## 6. Module layout + storage keys

```
apps/frontend/src/offline/
  storage.ts          (exists — AsyncStorage KV)
  catalog.ts          (new — text cache, full-replace sync, client search)
  images.ts           (new — expo-file-system download, manifest, GC)
  OfflineProvider.tsx (new — boot hydrate, NetInfo, sync orchestration, context)
  useOffline.ts       (new — hooks screens consume)
```

| Key | Value | Owner |
|---|---|---|
| `catalog:index` | `string[]` of slugs | catalog.ts |
| `recipe:{slug}` | full `RecipeDoc` | catalog.ts |
| `catalog:meta` | `{ lastSyncedAt }` | catalog.ts |
| `img:{slug}` | `{ sourceUrl, localUri }` | images.ts |
| `saved:{slug}`, `savedIds`, `session`, `guest`, prefs… | *(unchanged, existing)* | — |

---

## 7. Rollout (phased, each shippable)

1. **Phase 0 — Offline-safe launch.** The `AuthContext` refresh fix. Tiny, unblocks everything;
   returning users can open the app offline (against saved data) today.
2. **Phase 1 — Catalog cache (text).** `catalog.ts` + `OfflineProvider` + screen swaps + offline
   search. App now browses, filters, searches, and reads every recipe offline (images still remote).
3. **Phase 2 — Full image download.** `expo-file-system` + `images.ts` + the `imageSource` choke
   point. Header photos are on-device → **whole app offline complete.**
4. **Phase 3 — Freshness + storage UI + reconnect polish.** OfflineBadge wiring, “updated X ago”,
   NetInfo-driven resync, Settings → Offline.
5. **Phase 4 — bundled first-launch seed** ✅ `scripts/build-catalog-seed.mjs` builds
   `assets/catalog-seed.json` from the audited `content/recipes-enriched.json` (83 recipes, ~162 KB
   minified; workflow `status` dropped, images empty). `catalog.ts` loads it when nothing is synced
   yet, so a brand-new offline install shows the catalog on first launch; the first sync full-replaces
   it and images fill in on first connect. (The live published `/api/recipes` stays the runtime source
   of truth — a DB-driven export could later narrow the seed to exactly the published set.)

---

## 8. Acceptance criteria

- Signed-in user, airplane mode, cold launch → lands in the app (not `/auth/opening`), Home populated
  from cache, OfflineBadge visible.
- Offline: open **any** recipe (not just saved), browse by texture/facet, and search — all render from
  device, header photo included.
- Admin publishes/edits/unpublishes a recipe → after the next online sync the change (incl. a replaced
  header image) is reflected; unpublished recipes disappear and their image file is GC’d.
- Fresh install, one online session, then offline → full catalog + all header images available.
- Image storage stays ~one file per recipe; total footprint ≈ 15–35 MB for 100 recipes.

## 9. Open decisions

- **`expo-image` vs RN `Image`?** `expo-image` adds nicer transitions + its own disk cache, but we
  already manage files explicitly, so RN `Image` with `file://` URIs suffices. Recommend deferring
  `expo-image` unless we want the polish.
- **Search: local-only vs online-fuzzy fallback?** Proposed local-only once cached (simplest, always
  works). Revisit if server fuzzy quality is materially better.
- **Bundle the text seed (Phase 4)?** Nice first-run UX; small cost. Bundle **text only** — 15–35 MB of
  images would bloat the store binary.
- **Sources / subrecipes offline?** Included if they must work offline; confirm scope.
- **Move tokens/health profile to `expo-secure-store`?** Offline-first keeps sensitive data on-device
  longer; the session (incl. refresh token) currently sits in plaintext AsyncStorage. Worth doing
  alongside, though orthogonal to offline.
