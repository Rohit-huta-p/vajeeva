# Home filter pills

Status: in progress · 2026-09-02
Mockup: https://claude.ai/code/artifact/31840e08-975f-4b53-a569-acd724339ec7

## Goal

A calm row of quick filters under the Home search bar that a patient taps to
jump straight into a filtered recipe list:

```
Quick · No-cook · Make-ahead · Taste ▾ · Occasion ▾
```

- **Quick / No-cook / Make-ahead** — one-tap pills (the effort group).
- **Taste ▾** — a tap-to-open menu: Sweet · Savoury · Spicy · Refreshing.
- **Occasion ▾** — a tap-to-open menu: Breakfast · Snack · Side.

Tapping any pill (or a menu item) navigates to the recipe list filtered to that
one value — single-pick navigation, not multi-select combining.

Every pill is **admin-owned**: the admin marks which pills apply to each recipe.
No pill is guessed from data at read-time, so a pill never opens an empty list.

## Model — one `filter` facet

Reuses the discovery-tags machinery (`TagConfig` + `/api/tags` + `TagRows` +
`TagsPage`, see [discovery-tags](2026-08-24-discovery-tags.md)). The pills are a
single new controlled-vocabulary facet:

- `TAG_FACETS` gains `'filter'`.
- `TagConfig` gains an optional `group` field. For `filter` items it is one of
  `effort | taste | occasion` and drives the Home layout (effort renders flat,
  taste/occasion render as dropdowns). Empty for every other facet.
- The recipe gains `filters: string[]` — the codes checked for that recipe.

### Why a dedicated facet (and the tradeoff)

Several pills overlap values that already live on other facets — `Sweet`/`Savoury`
are `dietTags`, `Breakfast`/`Snack`/`Side` are `meals`, `No-cook` is a `method`,
`Make-ahead` is the `makeAhead` flag. A dedicated `filter` facet therefore
*duplicates* some of that data on tagged recipes.

We accept this deliberately: `filter` is a **curated Home-navigation surface**,
separate from the semantic facets that model the food. It gives the admin one
place to say "these are the Home pills, in these groups, in this order" and one
checklist per recipe, instead of scattering the pill set across meal/diet/method.
A one-time backfill seeds `filters[]` from the existing fields so the overlap
costs no manual work; drift (edit the meal but forget the pill) is the price, and
is acceptable for a navigation surface.

### Vocabulary (seed)

| code | label | group | seeds from |
|------|-------|-------|------------|
| `quick` | Quick | effort | step timers ≤ 20 min |
| `no-cook` | No-cook | effort | `methods` has `no-cook`, or 0 cook time |
| `make-ahead` | Make-ahead | effort | `makeAhead` = true |
| `sweet` | Sweet | taste | `dietTags` has `sweet` |
| `savoury` | Savoury | taste | `dietTags` has `savoury` |
| `spicy` | Spicy | taste | — (admin-tagged; no source yet) |
| `refreshing` | Refreshing | taste | `category` = liquid, or `meals` has `drink` |
| `breakfast` | Breakfast | occasion | `meals` has `breakfast` |
| `snack` | Snack | occasion | `meals` has `snack` |
| `side` | Side | occasion | `meals` has `side` |

## Phases

### Phase 1 — shared + api
- `packages/shared`: add `filters: z.array(z.string()).default([])` to
  `RecipeSchema` (so it survives `RecipeInputSchema` strip-on-write). `npm run build`.
- `apps/api/models/Recipe.ts`: `filters: { type: [String], default: [] }`.
- `apps/api/models/TagConfig.ts`: add `'filter'` to `TAG_FACETS`; add
  `group: { type: String, default: '' }`.
- `apps/api/routes/tags.routes.ts`: carry `group` through the public GET, admin
  GET, and admin PUT.
- `apps/api/scripts/seed-tags.ts`: seed the `filter` vocabulary (with groups).
- `apps/api/scripts/backfill-filters.ts` (new): populate each recipe's
  `filters[]` from existing fields per the table above. Idempotent, run on demand.

### Phase 2 — admin
- `TagRows`: add the `filter` facet as one "Home filters" multi-select section
  (sub-grouped by group for readability). Field: `filters`.
- `TagsPage`: manage the `filter` vocabulary (label + group + order + enabled),
  with curated defaults.

### Phase 3 — frontend
- `api/recipes.ts`: carry `filters` on `RecipeDoc` / `RecipeListItem` / `toListItem`.
- `config/facets.ts`: `matchTag` gains a `filter` axis (`r.filters` includes value).
- Home: fetch `/api/tags`, render the `filter` facet — `effort` flat, `taste` /
  `occasion` as tap-to-open menus; each item deep-links `?filter=<code>`.
- `RecipeListScreen`: accept `?filter=`, filter via `matchTag`, title from the pill.

### Phase 4 — verify
- `tsc --noEmit` clean across shared / api / admin / frontend.
- api tests green; admin tests green.
- Manual: pills render, dropdowns open, tap filters the list.

## Decisions locked
- Row: `Quick · No-cook · Make-ahead · Taste ▾ · Occasion ▾`.
- Taste = Sweet · Savoury · Spicy · Refreshing (no Warming/Neutral).
- Occasion = Breakfast · Snack · Side (Dessert/Drink dropped — overlap Sweet/Refreshing).
- Dietary group dropped.
- Single-pick navigation (a tap opens the filtered list).
