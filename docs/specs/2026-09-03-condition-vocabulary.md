# Condition vocabulary — one admin-managed list for profile + recipe flags

**Status:** proposed · **Date:** 2026-09-03
**Prerequisite for:** [admin-outcomes](2026-09-03-admin-outcomes.md) (§1, §5 adherence)
**Precedent:** [discovery-tags](2026-08-24-discovery-tags.md) (`TagConfig` controlled vocabulary)

**Problem:** The set of health conditions exists in **three disconnected places
that share no codes**, so a patient's condition never matches a recipe's flag, and
the admin's edits never reach patients:

| Where it lives | Codes | Form |
|---|---|---|
| Patient grid fallback — `apps/frontend/src/hooks/useHealthFlags.ts` | `DM` `OW` `LI` `SD` | 2-letter |
| Admin built-ins — `apps/admin/src/pages/HealthFlagsPage.tsx` | `DIABETES` `OBESITY` `LACTOSE_INTOLERANT` `CARDIAC` `PREGNANT` … (10) | UPPER_SNAKE |
| Recipe data — `Recipe.healthFlags[].condition` (`seed.json`) | `diabetes` `gluten` | lowercase free text |

Two live bugs compound it:
1. **Admin edits never reflect.** `HealthFlagsPage` PUTs `{label, description}` only;
   the API coerces `!!state.enabled` → every row saves `enabled: false`, and the
   public `GET /api/healthflags` returns *enabled only* → patients always fall back
   to the hardcoded 4. The reflect path is broken at the source.
2. **No personalisation.** `deriveFit` (`apps/frontend/src/api/recipes.ts`) reduces a
   recipe's *own* flags to a badge; it never joins to the patient's `healthProfile`.

**Goal:** one **admin-managed condition vocabulary** as the single source of truth
for **both** the patient health-profile options **and** recipe health-flag
conditions — so admin edits reflect to patients, and condition codes join cleanly
(unlocking "Safe for me" and the adherence model).

**Design stance:** `HealthFlagConfig` is the source of truth (mirror the
`TagConfig` precedent); codes are **lowercase slugs** (matches the recipe data and
the discovery-tags convention → least migration); additive and backward-compatible;
recipes and profiles store codes, never labels, so nothing drifts.

---

## 1. Canonical vocabulary

`HealthFlagConfig` is authoritative. Codes become lowercase slugs. Seed maps the
three legacy code sets onto one:

| Canonical code | Label | ← was (admin) | ← was (frontend) | ← recipe data |
|---|---|---|---|---|
| `diabetes` | Diabetes | `DIABETES` | `DM` | `diabetes` ✓ |
| `obesity` | Obesity | `OBESITY` | `OW` | — |
| `lactose-intolerance` | Lactose intolerance | `LACTOSE_INTOLERANT` | `LI` | — |
| `sedentary` | Sedentary lifestyle | `SEDENTARY` | `SD` | — |
| `cardiac` | Cardiac | `CARDIAC` | — | — |
| `pregnancy` | Pregnancy | `PREGNANT` | — | — |
| `lactating` | Lactating | `LACTATING` | — | — |
| `nut-allergy` | Nut allergy | `NUT_ALLERGY` | — | — |
| `infant-8m` | Infant (8m+) | `INFANT_8M` | — | — |
| `elderly` | Elderly / frail | `ELDERLY` | — | — |
| `gluten` | Gluten | — | — | `gluten` ✓ |

(Lowercase slugs chosen so the ≈83-recipe corpus — already `diabetes`/`gluten` —
barely moves, and to match `TagConfig` codes. The alternative, `UPPER_SNAKE`, would
re-tag every recipe. Locked below unless overridden.)

## 2. Data model

`apps/api/src/models/HealthFlagConfig.ts` — add the fields the admin UI already
implies but the schema lacks:

```ts
code:        String,   // slug, unique — unchanged
label:       String,   // unchanged
description: String,   // unchanged
enabled:     Boolean,  // unchanged — but must actually be set (see §3)
emoji:       { type: String, default: '' },   // NEW — admin page already has it
order:       { type: Number, default: 0 },    // NEW — admin-controlled sort
```

`User.healthProfile: [String]` and `Recipe.healthFlags[].condition` are unchanged in
*shape* — only their *values* migrate to canonical codes (§5).

## 3. API — fix the reflect path

- **`GET /api/healthflags` (public)** returns enabled rows, ordered by `order`, with
  `{ code, label, description, emoji }` — so the patient grid renders fully from data
  (today it merges descriptions from the frontend fallback by code, which breaks for
  any admin-added code).
- **`PUT /api/admin/health-flags`** must carry `enabled`, `emoji`, `order` (today it
  drops `enabled`). Keep full-replace semantics, or move to per-row PATCH — either
  way `enabled` must round-trip.
- **Write-time guard** on recipe create/update (mirror discovery-tags §3a): reject a
  `healthFlags[].condition` whose code is absent/disabled in `HealthFlagConfig`
  (400 with the offending code). Stops new free-text drift.

## 4. Admin + patient UI

- **`HealthFlagsPage`**: add an **enabled** toggle per card and an **order** control;
  send `enabled`/`emoji`/`order` on save. Drop the hardcoded `CONDITIONS` array as the
  source — seed the DB instead (§5) and render from `GET /api/admin/health-flags`
  (built-ins become just the seeded rows). Add/remove already work.
- **Recipe Editor health-flag rows**: the `condition` field becomes a **select from
  the vocab** (it's free text today), so recipes can only be flagged against real
  codes.
- **Patient grid** (`HealthFlagGrid` via `useHealthFlags`): already fetches
  `/api/healthflags`; once §3 returns enabled rows, admin edits reflect
  automatically. Demote `FALLBACK_FLAGS` to a thin offline cache (last-synced vocab),
  not a competing list. Onboarding + Settings already share this path.

## 5. Migration (idempotent scripts)

1. `apps/api/src/scripts/seed-healthflags.ts` (new) — upsert the §1 canonical rows,
   `enabled: true`, with `order` + `emoji`. (No script seeds `HealthFlagConfig`
   today — this is why it starts empty.)
2. Normalise **recipe** `healthFlags[].condition` → canonical slugs (map any
   `DIABETES`/legacy → `diabetes`, etc.; most are already `diabetes`/`gluten`).
3. Normalise stored **user** `healthProfile` codes → canonical slugs (map
   `DM`→`diabetes`, `OW`→`obesity`, `LI`→`lactose-intolerance`, `SD`→`sedentary`).
   Small/likely-empty pre-launch, but must run so existing profiles keep meaning.

## 6. Payoff — enables the downstream joins (not in this spec's core)

Once codes align, the personalised join becomes real and feeds
[admin-outcomes](2026-09-03-admin-outcomes.md):
- **"Safe for me"**: filter recipes whose `healthFlags` carry a non-`safe` severity
  for a condition in the patient's `healthProfile` (a real per-user `deriveFit`).
- **Adherence (§5 admin-outcomes)**: `healthProfile × healthFlags` avoidance flags
  now compute correctly, per patient and per cohort.

## 7. Acceptance criteria

- One vocabulary: `HealthFlagConfig` is the only condition list; admin add/edit/
  enable/order/remove round-trips and `enabled` sticks.
- An admin change (add a condition, enable it) **appears in the patient onboarding +
  Settings grid** after sync.
- A recipe can only be flagged against a vocab code (guard rejects unknown/disabled).
- Existing recipes and profiles read unchanged after migration (values mapped to
  canonical slugs).
- `healthProfile × healthFlags` joins non-empty for a patient whose condition matches
  a flagged recipe.

## 8. Decisions

- **Locked:** codes are lowercase slugs (least corpus churn + matches `TagConfig`).
- **Locked:** `HealthFlagConfig` is the single source of truth (not a separate
  profile list).
- **Locked:** per-condition `emoji` kept (added to the model + admin editor).
- **Locked (out-of-vocab data):** the recipe corpus also carried Ayurvedic doshas
  (`pitta`/`vata`/`kapha`) and loose medical terms. Resolution: **add the medical
  ones** to the vocab (`anemia`, `acidity`, `indigestion`; `digestion`→`indigestion`)
  and **drop the doshas** off recipes (logged per recipe by the migration; the source
  `recipes-enriched.json` retains them, and a dosha can be re-added anytime via the
  Health Flags page — re-adding the vocab entry does not restore per-recipe flags).
- **Locked:** `enabled` gates patient-grid visibility only; *presence* in the vocab
  is what makes a code valid on a recipe (so a condition can exist for recipes while
  hidden from patients). The write-guard checks presence; it **skips when no vocab is
  configured** (bootstrap / tests).
- **Open:** full-replace PUT vs per-row PATCH for the admin editor (either works if
  `enabled` round-trips).
