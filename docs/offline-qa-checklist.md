# Offline QA Checklist — Vajeeva

Manual test pass for the offline-first feature (spec: `docs/specs/2026-08-27-offline-full-download.md`).
Run on a real device or simulator. Phase tags map each check to what shipped.

**How it works (context):** at every launch the app loads the on-device cache into memory and renders
from it *before* any network check, then syncs in the background if online. A fresh install with no
cache falls back to a bundled seed. So "offline from the start" holds once the app has synced at least
once — and, for text, even on a brand-new install.

---

## 0. Setup / preconditions
- [ ] App built and installed (dev build or simulator).
- [ ] You can toggle connectivity (airplane mode, or the simulator's network link).
- [ ] A test account (email + password) **and** the guest path are both available.
- [ ] The API + DB are reachable when "online" (so the first sync has data to pull).
- [ ] Know how to fully quit the app (not just background) to test cold launches.

---

## A. Cold first launch (fresh install) · Phase 4
- [ ] **A1 — fresh install, ONLINE:** install, open with network → catalog syncs, recipes and header photos appear.
- [ ] **A2 — fresh install, OFFLINE:** install, enable airplane mode *before* first open → **all recipes still show** (text) from the bundled seed; photos show the SVG placeholder; the Offline badge is visible; browse / search / open a recipe all work.
- [ ] **A3 — then go online:** from A2, disable airplane mode → catalog re-syncs, header photos download, Offline badge disappears.

## B. Returning user offline (the core promise) · Phases 0–2
- [ ] **B1 — full app from cache:** open once online (let the sync finish), fully quit, enable airplane mode, reopen → Home counts, Browse-by-texture, list, search, recipe detail, **and header photos** all render instantly offline. Offline badge visible.
- [ ] **B2 — signed-in stays signed-in:** signed-in user, airplane mode, cold launch → lands in the app (NOT bounced to the opening/login screen).
- [ ] **B3 — guest offline:** continue as guest online once, then airplane-mode cold launch → app works, browses offline.

## C. Auth offline · Phase 0
- [ ] **C1** returning signed-in user, offline launch → still signed in (session preserved).
- [ ] **C2** online, tap Sign out → returns to auth flow (sanity: real logout still works).
- [ ] **C3** brand-new user, offline → cannot register (expected — sign-up needs network; message is graceful, no crash).

## D. Content & search offline · Phase 1
- [ ] **D1** browse by each texture (Solid / Liquid / Semi-solid) offline → counts and lists are correct.
- [ ] **D2** mood chips / facets and "Cook with…" ingredient filters offline → filter correctly.
- [ ] **D3** search offline by name, by ingredient, by Tamil/Sanskrit name, and with a missing diacritic → returns matches.
- [ ] **D4** open a recipe detail offline → full recipe: ingredients, steps, health flags, sources, yield/shelf-life.
- [ ] **D5** enter Cook mode offline → steps render and advance.

## E. Header images offline · Phase 2
- [ ] **E1** after an online sync, airplane mode → header photos render on grid cards, the Saved list, and the detail hero.
- [ ] **E2** a recipe with no photo → SVG placeholder, never a broken-image tile.
- [ ] **E3 — photo replaced:** admin swaps a recipe's header photo → after the next online sync the new photo shows, and the old file is garbage-collected (storage doesn't creep upward).
- [ ] **E4 — recipe removed:** admin unpublishes/deletes a recipe → after the next sync it disappears from the app and its image file is GC'd.

## F. Sync & reconnect · Phases 1–2
- [ ] **F1 — reconnect:** while in the app, turn connectivity back on → catalog re-syncs and new/changed recipes + images appear **without** a manual refresh.
- [ ] **F2 — pull to refresh:** pull-to-refresh on the recipe list triggers a resync.
- [ ] **F3 — new content:** publish a new recipe on the server → it appears after the next sync.
- [ ] **F4 — backend down, network up:** stop the API but keep the device online → the app still works from cache and does not crash or hang.

## G. Freshness & storage UI · Phase 3
- [ ] **G1** Offline badge shows in the Home header when offline, and is hidden when online.
- [ ] **G2** Profile → **Offline** shows "{N} recipes · {M} photos" matching the catalog size and how many photos have downloaded.
- [ ] **G3** Profile → Offline → **Update now** shows "synced X ago"; tapping it while online updates and the time resets to "just now"; it reads "Updating…" during the sync.
- [ ] **G4** tapping **Update now** while offline → no crash; it fails silently and stays on the cache.

## H. Saved recipes offline
- [ ] **H1** save a recipe, airplane mode, reopen → the saved card and its detail render from the device.
- [ ] **H2** save on one device (online), sign in on another → the saved set syncs across devices.

## I. Edge cases / regression
- [ ] **I1** kill the app mid image-download, reopen (online) → it re-downloads the missing photos; no broken state.
- [ ] **I2** after many syncs, the image folder does not grow unbounded (GC keeps it to one file per current header).
- [ ] **I3** a low-storage device (if testable) → downloads degrade gracefully; the app doesn't crash.
- [ ] **I4** web build (if used) → text cache works; note that file-system image caching is native-only, so web uses remote image URLs.

---

## Known limitations (expected — not bugs)
- Brand-new **sign-up** requires a network connection.
- The **bundled seed** is a snapshot of the audited content; on a first-ever offline launch it may show recipes that aren't published yet — the first online sync reconciles to the published set.
- Only **header photos** are cached offline; per-step images (if any are added later) stay remote.
- Bundled-seed recipes ship with **no images**; photos fill in on the first online session.
- Regenerate the bundled seed after content changes: `yarn build:catalog-seed` (from `apps/frontend`), then commit `assets/catalog-seed.json`.
