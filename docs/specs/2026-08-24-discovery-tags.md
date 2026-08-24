# Discovery Tags — schema + admin editor spec

**Status:** proposed · **Date:** 2026-08-24
**Problem:** a recipe's only classification is `category` (solid/liquid/semi-solid). The
Brief (§6) wants browse by **type, meal, main ingredient, method, and diet** — and the Home
mood chips ship as only *Quick / No-cook / Cooling* because "Something sweet" and "Make-ahead"
have no data to filter on. This spec adds an admin-authored discovery taxonomy and the editor
to maintain it.

**Design stance:** additive and backward-compatible (existing recipes stay valid, untagged),
**controlled vocabularies** (recipes store codes, not free text, so filters never drift), and
mirror the `HealthFlagConfig` precedent for admin-managed value lists.

---

## 1. The taxonomy

| Facet | Recipe field | Card. | Values from | Examples | Powers (user side) |
|---|---|---|---|---|---|
| **Type** | `type` | single | vocab `type` | roti · paratha · laddu · halwa · vada · panaka · buttermilk · soup · payasa · porridge · shrikhand · chutney · preserve · rice | sub-type chips under the texture pillars; “Browse by type” |
| **Meal** | `meals` | multi | vocab `meal` | breakfast · snack · side · drink · dessert | “Browse by meal” |
| **Main ingredient** | `mainIngredients` | multi (1–3) | vocab `ingredient` | coconut · barley · amla · black-gram · milk · ghee · jaggery · sesame | **“Cook with…” tiles**; ingredient browse; search aliases |
| **Method** | `methods` | multi | vocab `method` | steamed · fried · baked · roasted · boiled · no-cook · fermented · soaked | method filter; supports “OR bake / OR air-fry” variants |
| **Diet** | `dietTags` | multi | vocab `diet` | sweet · savoury · no-added-sugar · dairy · high-protein | **“Something sweet” chip**; diet filters |

**Companion fields** (Gap #2, ride along here — small fields, high payoff):

| Field | Type | Powers |
|---|---|---|
| `makeAhead` | boolean | **“Make-ahead” chip** + the “start the night before” heads-up |
| `prepAheadNote` | string | the actual heads-up copy (“soak black gram overnight”) |
| `totalTimeMin` | int? | true total time when it exceeds summed step timers (soaks, hangs) |

**Cardinality rationale:** `type` is the recipe's primary identity → single. Everything else
is genuinely multi (a laddu is *snack* + *dessert*; a dish can feature coconut **and** jaggery;
baati has oven/air-fryer/pan methods).

**Not in this spec** (still derived, unchanged): `quick` / `no-cook` / `cooling` continue to
derive from `cookTimeMin` + `category` (see §6) — `dietTags: sweet` and `makeAhead` are the two
the chips were missing.

---

## 2. Data model

### 2a. Vocabulary collection — `TagConfig` (new)

Mirrors `apps/api/src/models/HealthFlagConfig.ts`. One row per allowed value, keyed by facet.

```ts
// apps/api/src/models/TagConfig.ts
import mongoose from 'mongoose';

const TagConfigSchema = new mongoose.Schema({
  facet:   { type: String, required: true, enum: ['type','meal','ingredient','method','diet'] },
  code:    { type: String, required: true },          // slug: 'black-gram'
  label:   { type: String, required: true },          // display: 'Black gram'
  order:   { type: Number, default: 0 },              // sort within a facet
  enabled: { type: Boolean, default: true },          // hide without deleting
}, { timestamps: true });

TagConfigSchema.index({ facet: 1, code: 1 }, { unique: true });
export const TagConfig = mongoose.model('TagConfig', TagConfigSchema);
```

### 2b. Recipe fields (additive)

`packages/shared/src/schemas/recipe.schema.ts` — add to `RecipeSchema` (all optional/defaulted,
so `RecipeInputSchema` and every existing recipe stay valid):

```ts
type:            z.string().default(''),               // code from vocab 'type'
meals:           z.array(z.string()).default([]),
mainIngredients: z.array(z.string()).default([]),
methods:         z.array(z.string()).default([]),
dietTags:        z.array(z.string()).default([]),
makeAhead:       z.boolean().default(false),
prepAheadNote:   z.string().default(''),
totalTimeMin:    z.number().int().min(0).optional(),
```

Mirror the same fields in `apps/api/src/models/Recipe.ts` (String / [String] / Boolean / Number).

> **Validation note:** keep these as plain strings in the schema (not enums). The *source of
> truth for allowed values is `TagConfig`*, enforced at write time in the API (§3), so the vocab
> can grow without a schema/deploy. Belt-and-suspenders: the admin editor only offers vocab codes.

---

## 3. API

### 3a. Recipe CRUD
No new endpoint — the new fields flow through the existing admin create/update via
`RecipeInputSchema`. Add a write-time guard in `recipes.routes.ts` (admin create/update): reject
any tag code not present & enabled in `TagConfig` for its facet (400 with the offending codes).

### 3b. Public vocab — `GET /api/tags` (new, in a small `tags.routes.ts`)
Returns enabled values grouped by facet so the **app renders chips/tiles from data**, not
hardcoded lists:

```json
{ "type":[{"code":"laddu","label":"Laddu"}, …],
  "meal":[…], "ingredient":[…], "method":[…], "diet":[…] }
```

Admin CRUD for the vocab: `GET/POST/PATCH/DELETE /api/admin/tags` (behind `requireAdmin`,
same pattern as `healthflags.routes.ts`).

### 3c. Recipe list filtering
Extend the public list (`recipes.routes.ts` + `recipesApi.list` in `apps/frontend/src/api.ts`)
to accept optional facet params alongside the existing `category`:

```
GET /api/recipes?type=laddu&ingredient=coconut&meal=dessert&method=no-cook&diet=sweet&makeAhead=true
```
Semantics: **AND across facets, OR within a facet's repeated values.** Corpus is small (≈83), so
a Mongo `$all`/`$in` query is trivial; the frontend may also filter client-side (it already loads
per-category), but the query param keeps `RecipeListScreen` and deep links clean.

---

## 4. Admin editor

### 4a. `RecipeEditorPage` — a `TagRows` block
New component `apps/admin/src/components/TagRows.tsx`, styled like `HealthFlagRows` /
`IngredientRows`. Placement: **right after the `category` field**, before ingredients (tags are
classification).

Per facet, a labelled chip multi-select sourced from `GET /api/admin/tags`:
- **Type** → single-select (radio-style chips).
- **Meal / Main ingredient / Method / Diet** → multi-select (toggle chips).
- **Make-ahead** → a checkbox + a `prepAheadNote` text field that reveals when checked.
- Unknown/legacy codes on a recipe render as a muted “retired” chip so nothing is silently lost.

```tsx
<TagRows
  value={{ type, meals, mainIngredients, methods, dietTags, makeAhead, prepAheadNote }}
  vocab={vocab}                 // from GET /api/admin/tags
  onChange={patch => setForm(f => ({ ...f, ...patch }))}
/>
```

### 4b. Derivation-assist (accelerates tagging the backlog)
When a recipe has empty tags, show a **“Suggested”** strip above each facet, computed locally
from the recipe the admin is already editing — one tap to accept:
- `mainIngredients` ← fuzzy-match `ingredients[].nameEn` against the ingredient vocab.
- `dietTags: sweet` ← any ingredient matches sugar/jaggery/honey/dates; also implies `meals: dessert`.
- `methods: no-cook` ← no step has `heat`; else infer from step verbs (fry/bake/roast/steam).
- `makeAhead` ← step/`shelfLife` text matches soak/overnight/ferment/rest/preserve.
- `type` ← keyword map on `nameEn` (…laddu/modaka → laddu; …roti/paratha → bread…).
Suggestions are *never* auto-saved — the admin confirms. This turns tagging 83 recipes into a
mostly-one-tap review.

### 4c. `TagsPage` — manage the vocabularies
New admin page (mirror `HealthFlagsPage`): a tab per facet, CRUD rows of `{ code, label, order,
enabled }`. Guard: block deleting a code that recipes still reference (offer “disable” instead).
Add to `AdminLayout` nav next to “Health Flags”.

---

## 5. User-side wiring

- **`RecipeListItem` + `toListItem`** (`apps/frontend/src/api/recipes.ts`): carry `type`, `meals`,
  `mainIngredients`, `methods`, `dietTags`, `makeAhead`.
- **`config/facets.ts`** becomes data-driven (fetch `GET /api/tags`), and `matchFacet` grows:
  ```ts
  case 'sweet':      return r.dietTags.includes('sweet');
  case 'make-ahead': return r.makeAhead;
  case 'quick':      return r.cookTimeMin > 0 && r.cookTimeMin <= 20;   // unchanged
  case 'no-cook':    return r.cookTimeMin === 0;                        // unchanged
  case 'cooling':    return r.category === 'liquid' || r.meals.includes('drink');
  ```
  Home’s mood row can now show the **full set** (Quick · No-cook · Make-ahead · Something sweet ·
  Cooling drink), and the deferred “A/B” chips from the redesign light up.
- **Home “Cook with…” tiles**: render from the `ingredient` vocab (top N by recipe count) →
  `?ingredient=coconut`.
- **`RecipeListScreen` Filter sheet** (Brief §6): type/meal/ingredient/method chips, driven by
  the same vocab; compose with the existing texture chips.

---

## 6. Backfill & migration

1. `apps/api/src/scripts/seed-tags.ts` — insert the initial `TagConfig` vocab (curated lists in §1).
2. `apps/api/src/scripts/backfill-recipe-tags.ts` — run §4b heuristics over every recipe, write the
   guesses **as drafts** (or to a `tagsSuggested` staging field), then require an admin review pass.
   Existing recipes need **no migration to stay working** — untagged simply means “no facet match”,
   which is safe (they still appear under texture + search).

---

## 7. Rollout (phased, each shippable)

1. **Schema + vocab + `GET /api/tags`** — backward-compatible; recipes untagged, app unchanged.
2. **Admin: `TagRows` + `TagsPage` + `seed-tags`** — admins can tag; nothing user-facing yet.
3. **Backfill + review pass** — tag the ≈83 (heuristics + human confirm).
4. **User-side: data-driven facets** — expand mood chips (Sweet, Make-ahead), add “Cook with…”
   tiles and the RecipeList Filter sheet.

---

## 8. Acceptance criteria
- New recipe fields validate & round-trip through admin create/update; existing recipes load
  unchanged with empty tags.
- API rejects a tag code not enabled in `TagConfig`.
- `GET /api/tags` returns enabled, ordered values per facet.
- Editing a recipe: setting `dietTags:['sweet']` makes it match the Home **Something sweet** chip;
  `makeAhead:true` makes it match **Make-ahead**; `?ingredient=coconut` returns only coconut recipes.
- Deleting a vocab value in use is blocked (disable offered instead).

## 9. Open decisions
- **`type` single vs multi?** Proposed single (primary identity). Revisit if dishes need dual type.
- **Server filter vs client filter** for the list — spec supports both; pick server for deep links.
- **`totalTimeMin`** — include now, or defer with the rest of the make-ahead/time work (Gap #2)?
- **Diet vs safety overlap** — `dietTags` is for discovery (“sweet”), NOT safety; keep it separate
  from `healthFlags` (which stays the contraindication source of truth).
