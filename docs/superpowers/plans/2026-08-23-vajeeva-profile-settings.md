# Vajeeva — Profile / Settings (production) implementation plan

**Date:** 2026-08-23
**Status:** Approved (layout signed off)
**Scope:** Mobile `apps/frontend` — turn the More tab into a production settings hub
**Design ref:** `prototypes/explorations/vajeeva-profile-production.html` (signed-in top + continuation + guest)
**Fills:** audit gap #3 (health-profile edit) — and grows it into the full profile surface

---

## 1. Goal

Convert the More tab from a chips-only screen into a production **grouped-settings hub** with an
identity header on top. It serves three jobs at once: **personalization** (health profile, units),
**data ownership** (saved + offline/sync, guest→account conversion), and **trust/compliance**
(sources, medical disclaimer, privacy/terms, delete-account, version).

Approach C's health card + edit sheet — already built — is kept verbatim and rides at the top of
the hub.

## 2. Current state (grounded)

**Already built (this branch, reused as-is):**
- `ProfileScreen` (approach C: identity hero + health card + sheet)
- `useHealthProfile` / `useHealthFlags` / `HealthFlagGrid` / `HealthProfileSheet`, `IconEdit`
- Tests: `useHealthProfile`, `HealthProfileSheet`, `ProfileScreen` (14 green; `tsc` clean)

**Facts that shape sequencing:**
- **No theme system.** No `useColorScheme`/`Appearance`/ThemeContext; `colors` is a static const;
  dark exists only as cook-mode `cm*` tokens applied by hand → **Appearance is its own project**.
- **Units is local-only** — `RecipeDetailScreen.tsx:67` `useState<'g'|'cup'>('g')`; no pref/store.
- **Sync surface** — `useSavedRecipes` returns `{ ids, recipes, loading, reload, save, unsave, isSaved }`;
  count is free, but **no `lastSynced`** is exposed.
- **Content** — `Disclaimer.tsx` copy exists; `app/source/[slug].tsx` renders one source, but there's
  **no sources-list or About screen**.
- **Version** — `app.json` `version: "1.0.0"`; `expo-constants` already a dep.
- **Routing** — file-based (expo-router); `AuthContext` exposes `isGuest`, `logout`, `user{email,name?}`.

## 3. Architecture decisions

- **Row primitives (once):** `SettingsGroup` + `SettingsRow` (icon · label · right = value/chev/switch)
  in `src/components/shared/`. All sections use these; keeps the grammar in one place.
- **Preferences store:** `usePreferences` hook over AsyncStorage (`preferences` key: `{ units,
  appearance, textScale, keepAwake }`), mirroring `useHealthProfile` (local-first, best-effort).
- **Name editing:** extend `AuthContext` with `updateProfile({name})` → set user state + rewrite the
  `session` store + best-effort `PATCH /users/me {name}` (endpoint already accepts `name`).
- **Simple pickers = sheets, not routes.** Units / Appearance / Text size reuse the
  `HealthProfileSheet` bottom-sheet pattern (small, consistent, no route sprawl).
- **Content = routes.** About, Sources & method, Medical disclaimer, Privacy, Terms → files under `app/`.
- **Guest vs signed-in** branch inside `ProfileScreen` on `isGuest`: guest swaps the identity card for
  the conversion banner and hides Account/Delete.
- **Icons:** add to `icons.tsx` — `IconRuler, IconTheme, IconSun, IconType, IconSync, IconDoc,
  IconChat, IconHelp, IconStar, IconTrash, IconShield` (Edit/User/Bookmark/Leaf/Info exist).

## 4. Slices (each shippable, tested, `tsc` clean)

### Slice 1 — Structural hub + free wins  ·  no backend, no theme
The big visible jump; everything here works against today's API.
- **Primitives:** `SettingsGroup`, `SettingsRow` (+ RN `Switch` wrapper `SettingsToggle`).
- **Rewrite `ProfileScreen`** to the grouped hub:
  - Identity header (avatar + name + email + "member since"; edit → **NameEditSheet**).
  - Health-profile card (unchanged — reuse built component).
  - **Guest banner** when `isGuest` → routes to `/auth/opening`; hide Account/Delete for guests.
  - **About & trust:** Sources & method, Medical disclaimer.
  - **Support:** Send feedback (`Linking` mailto), Rate Vajeeva (`Linking` store URL — placeholder const).
  - **Account:** Sign out; **app version** footer via `Constants.expoConfig?.version`.
- **Name editing:** `AuthContext.updateProfile` + `NameEditSheet` (reuse sheet grammar).
- **New content screens:** `app/more/about.tsx`, `app/more/sources.tsx` (list from `GET /api/sources`,
  fallback to `content/`), `app/more/disclaimer.tsx` (reuse `Disclaimer` copy).
- **Tests:** ProfileScreen hub (guest vs signed-in; rows; sign out; edit opens), `updateProfile`,
  `SettingsRow`.
- **Defer:** units behavior, theme, delete, privacy/terms docs, sync detail.

### Slice 2 — Preferences that pay off  ·  small backend-free wins
- `usePreferences` hook (AsyncStorage).
- **Units** picker sheet (Grams/Cups) → store; **wire `RecipeDetailScreen:67`** to seed from the pref.
- **Keep screen awake (cooking)** toggle → store; add `expo-keep-awake` and gate `useKeepAwake()` in
  `CookModeScreen` on the pref — **closes Cook-mode gap #9**.
- **Text size** sheet (Default/Large) → `textScale`; apply through the existing `sc()` scale layer
  (`theme/scale.ts`) — ⚠ verify interaction with the guideline-based scaler before committing the UX.
- **Tests:** `usePreferences`; RecipeDetail seeds unit from pref; CookMode keep-awake gating.

### Slice 3 — Store-readiness & theming  ·  larger / gated
- **Appearance / theme** (its own mini-project): `ThemeContext` (system/light/dark) + make `colors`
  theme-aware + thread through screens. Isolated here because it touches everything.
- **Delete account:** new API `DELETE /users/me` (auth) + double-confirm client flow → logout + clear
  local. (Apple/Play requirement.)
- **Privacy Policy / Terms:** real documents (owner input) → in-app markdown screens or `Linking`.
- **Offline & sync detail:** add `lastSynced` to the sync engine; row shows "Synced · Xm" + Sync now.
- **Connected sign-ins:** lands with SSO (audit gaps #1–2).

## 5. Wiring seams (quick ref)

| Concern | Store / endpoint | State |
|---|---|---|
| Health profile | `healthProfile` key · `PATCH /users/me` | built |
| Preferences | `preferences` key | new (slice 2) |
| Name | `session` store · `PATCH /users/me {name}` | new (slice 1) |
| Saved / sync | `useSavedRecipes` · sync engine | count free; `lastSynced` new (slice 3) |
| Delete account | `DELETE /users/me` | new (slice 3) |

## 6. Testing & verification

- Per slice: RNTL component tests for ProfileScreen states + each sheet; unit tests for hooks; keep
  `npx jest` + `npx tsc --noEmit` green (AsyncStorage-touching suites use the official jest mock).
- Visual: drive expo web to the More tab; check signed-in (seeded login) and guest states.

## 7. Risks / flags

- **Theme** is the largest lift (every screen) — quarantined to slice 3; don't let it block 1–2.
- **Text size** interacts with the `sc()` guideline scaler — validate before shipping the control.
- **Privacy/Terms** need real legal content — product/owner dependency.
- **Delete account** is irreversible — double-confirm UX + backend before enabling.

## 8. Out of scope (per PRD §12)

Push notifications, full UI i18n, social, payments. (Recipe EN+Tamil names stay; no name-language pref.)

---

**Recommended start:** Slice 1 — it converts the screen to the production hub and lands every
no-dependency win (identity + name edit, guest banner, About/Sources/Disclaimer, feedback/rate,
sign out, version) in one coherent pass.
