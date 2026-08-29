# Ingredient fields — quantityG, quantityMl, quantityCup, note

**Date:** 2026-08-30  
**Status:** implemented  
**Scope:** shared schema · API model · admin editor

---

## Overview

Each ingredient in a recipe carries four data fields:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `quantityG` | `string` | yes | Weight in grams, e.g. `"150"`, `"2–3"`, `"a pinch"` |
| `quantityMl` | `string` | optional | Volume in millilitres, e.g. `"200"`, `"to taste"` |
| `quantityCup` | `string` | yes | Cup / spoon measure, e.g. `"¼ cup"`, `"1 tbsp"` |
| `note` | `string` | optional | Supplementary context, e.g. `"to taste"`, `"soaked overnight"`, `"(Idlimbu in Kannada)"` |

---

## Design decisions

### All quantity fields are strings, not numbers

The source texts (classical Ayurvedic literature) use qualitative language — "a pinch", "to taste", "as required", "2–3 pieces". Storing quantities as `number` would coerce these to `0` and lose information. A string stores whatever the source says and lets the UI decide how to render it.

### quantityG is the primary weight field

The frontend ingredient table has a g / cup toggle. The g column shows `quantityG` as entered. **Do not `parseInt()` this field** — it would turn `"a pinch"` → `0 g` silently. The data is already a display-ready string.

### quantityMl is a parallel volume field

Some liquids have a meaningful ml measurement that differs from the g column (water, oils, juices). `quantityMl` is optional so solid recipes carry no empty field. It was added in the same admin-editor pass as `note`.

### note is NOT a quantity substitute

`note` is supplementary context — an aside that appears in italic below or beside the ingredient row. It is not the place to put a measurement. Examples of correct use:

- `"to taste"` — qualitative instruction from the source
- `"soaked overnight"` — preparation state
- `"(Idlimbu in Kannada)"` — vernacular name / glossary link
- `"or substitute ghee"` — editorial aside

If the docx says a quantity is "to taste", the quantity fields (`quantityG` / `quantityMl`) carry `""` or the numeric equivalent where one exists; the qualitative phrase goes in `note`.

---

## Schema locations

### Shared Zod schema
`vajeeva/packages/shared/src/schemas/recipe.schema.ts`

```ts
export const IngredientSchema = z.object({
  nameEn:      z.string().min(1),
  quantityG:   z.string(),
  quantityMl:  z.string().optional(),
  quantityCup: z.string(),
  note:        z.string().optional(),
});
```

### API Mongoose model
`vajeeva/apps/api/src/models/Recipe.ts`

```ts
const IngredientSchema = new mongoose.Schema({
  nameEn:      String,
  quantityG:   String,
  quantityMl:  { type: String, default: '' },
  quantityCup: String,
  note:        { type: String, default: '' },
}, { _id: false });
```

---

## Admin editor

`vajeeva/apps/admin/src/components/IngredientRows.tsx`

Six-column grid layout per ingredient row:

```
Ingredient | g | ml | Cups | Notes | (delete)
```

The **Notes** input is italic, placeholder `"to taste, soaked…"`, initialised to `''` when a new row is added. It maps directly to the `note` field on save.

---

## Frontend (RecipeDetailScreen / IngredientTable)

`vajeeva/apps/frontend/src/screens/RecipeDetailScreen.tsx` maps API docs to `DetailView`. The current `toDetailView()` mapping **does not yet pass `note` or `quantityMl`** to the UI — only `amountG` (parsed with `parseInt`, which is a known lossy step) and `amountCup` are forwarded. This is a tracked gap, not a schema gap.

`vajeeva/apps/frontend/src/components/shared/IngredientTable.tsx` renders `${ing.amountG} g` in gram mode. Once `toDetailView` is updated to pass the raw string and `note`, `IngredientTable` will need a corresponding update.

---

## Content pipeline

The JSON seed files (`content/parsed/`, `content/enriched/`) use the same field names. When entering data from a docx source, follow this mapping:

| Docx says | `quantityG` | `quantityMl` | `quantityCup` | `note` |
|---|---|---|---|---|
| `"150 g"` | `"150"` | `""` | `"—"` | `""` |
| `"1 cup"` | `""` | `""` | `"1 cup"` | `""` |
| `"200 ml"` | `""` | `"200"` | `""` | `""` |
| `"to taste"` | `""` | `""` | `""` | `"to taste"` |
| `"2 tbsp (for taste)"` | `""` | `""` | `"2 tbsp"` | `"for taste"` |
| `"a pinch"` | `""` | `""` | `""` | `"a pinch"` |
| `"Idlimbu in Kannada"` | `"—"` | `""` | `"—"` | `"Idlimbu in Kannada"` |
