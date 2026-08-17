# Recipe Detail — Design Spec

**Date:** 2026-08-17  
**Status:** Awaiting implementation  
**Scope:** Recipe detail screen, ingredient components, filter sheet additions, source glossary integration  
**Recipes covered:** 83 (44 Solid · 23 Liquid · 16 Semi-solid)

---

## 1. Problem

The recipe data has 16 distinct fields. The current design surfaces 4 of them:
English name, ingredient name, ingredient quantity (metric only), and method steps.
The remaining 12 fields have no UI home.

---

## 2. Data Field Inventory

Every field present in `vajeeva-recipes.md`, mapped to its design home.

| # | Field | Example | Design home |
|---|-------|---------|-------------|
| 1 | English name | Coconut Laddu | Recipe card · Detail header |
| 2 | Sanskrit / classical name | *Narikela Modaka* | Detail header (secondary) · Recipe card (tertiary) |
| 3 | Source citations | KK 10/54 · ICMR-NIN 2024 | Detail — source bar (tappable → D4 Glossary) |
| 4 | Texture category | Solid / Liquid / Semi-solid | Browse B1 · Detail tag |
| 5 | Sub-category | Sweet / Bread / Soup | Filter B2 (new row) · Detail tag |
| 6 | Yield | 3–4 laddoos | Detail — yield badge |
| 7 | Shelf life | keeps 5–7 days | Detail — shelf life badge (when present) |
| 8 | Contraindication flags | 🔴 DM · OW · LI · SD | Detail — contraindication card (always visible) · Recipe card (dot indicators) |
| 9 | Ingredient name | Grated coconut | Detail — ingredient table |
| 10 | Quantity — metric | 40–50 g | Detail — ingredient table (default unit) |
| 11 | Quantity — volumetric | ¼ cup | Detail — ingredient table (toggled unit) |
| 12 | Ingredient stage group | Dough / Filling / Syrup | Detail — stage header row in ingredient table |
| 13 | Shared sub-recipe pointer | *Aromatic powder blend* | Detail — footnote pill → bottom sheet |
| 14 | Method steps | numbered 1–8 | Detail · Cook mode |
| 15 | Cook phase label | Phase · Roast in ghee | Cook mode step header |
| 16 | Step timer | 10:00 | Cook mode step header |

---

## 3. Layout Rule — Hybrid by Complexity

The recipe detail screen renders in one of two layouts determined at runtime by step count.

```
steps < 4  →  Option 1 · Additive scroll
steps ≥ 4  →  Option 2 · Tabbed + pinned cook button
```

This threshold matches the existing cook mode eligibility rule (cook mode only for 4+ step recipes).

### 3.1 Counts by section

| Section | Total | Simple (< 4 steps) | Complex (4+ steps) |
|---------|-------|-------------------|-------------------|
| Solid | 44 | ~8 | ~36 |
| Liquid | 23 | ~15 | ~8 |
| Semi-solid | 16 | ~9 | ~7 |
| **Total** | **83** | **~32** | **~51** |

---

## 4. Option 1 — Additive Scroll (Simple Recipes)

Used when `steps < 4`. No cook button.

### Screen structure — top to bottom

```
Status bar
Nav bar  ← Recipe Detail  ♡
─────────────────────────────────────────
Hero block
  English name          [serif, 19px, bold]
  Sanskrit name         [serif italic, 12px, amber]
  Category tags         [S-01 · Liquid · Panaka]
─────────────────────────────────────────
Source block
  Label: "Classical source"
  Pills: [KK 10/54 ↗]  [ICMR-NIN 2024 ↗]    ← tappable → D4
─────────────────────────────────────────
Yield block
  Label: "Yield"
  Badges: [🫙 ~200 ml]  [Serve immediately]
─────────────────────────────────────────
Contraindication card                          ← omitted if none
  ⚠ Use with caution
  Condition list (inline)
─────────────────────────────────────────
Ingredients block
  Header row: "Ingredients"   [g] [cup] toggle
  Ingredient table (see §6.1)
  Footnote pill if shared sub-recipe (see §6.3)
─────────────────────────────────────────
Method block
  Label: "Method · N steps"
  Numbered step list (see §6.4)
─────────────────────────────────────────
[bottom padding — no cook footer]
```

---

## 5. Option 2 — Tabbed + Pinned Cook (Complex Recipes)

Used when `steps ≥ 4`. Cook button is **always pinned outside the tab content area**.

### Screen structure

```
Status bar
Nav bar  ← Recipe Detail  ♡
─────────────────────────────────────────
Compact hero  [always visible, never scrolls]
  English name          [serif, 17px, bold]
  Sanskrit name + meta  [italic amber + "S-24 · Solid · Sweet"]
─────────────────────────────────────────
Tab strip  [always visible]
  Overview   |   Ingredients   |   Steps
─────────────────────────────────────────
Scrollable tab content area
  (see tab specs below)
─────────────────────────────────────────
Cook footer  [always pinned, outside scroll]
  [▶  Start Cook]
```

### 5.1 Overview tab

```
Source block
  Pills: [KK 10/86 ↗]  [ICMR-NIN 2024 ↗]
Yield block
  Badges: [🫙 2–3 momo]
Contraindication card (if present)
  ⚠ Use with caution
  Condition list
Category block
  Tags: [S-24] [Solid] [Sweet] [Fried]
Complexity note
  "4 steps · 2 ingredient stages · Contains shared sub-recipe"
```

### 5.2 Ingredients tab

```
Header row: "N ingredients · M stages"   [g] [cup] toggle
Ingredient table with stage headers (see §6.1–6.2)
Aromatic powder footnote pill (if present, see §6.3)
```

### 5.3 Steps tab

```
Label: "N steps"
Numbered step list, each with:
  Step number circle
  Phase label (amber, 8px uppercase) — e.g. DOUGH / FILLING / FRY
  Step instruction text
```

---

## 6. Components

### 6.1 Ingredient table

Two-column table: Ingredient name | Quantity.

**Unit toggle** — a two-button `[g]` `[cup]` control in the ingredients header. Default: `g`. State: session-scoped (resets on app restart). Toggle switches all quantity cells simultaneously.

Each quantity cell stores both values as data attributes; JS swaps on toggle.

```
| Ingredient        | Quantity     |
|-------------------|--------------|
| Grated coconut    | 40–50 g      |  ← default (g active)
```

Alternating row tint: `rgba(233,225,208, 0.45)` on odd rows.

### 6.2 Stage header rows

For recipes with multiple ingredient stages (Dough / Filling / Syrup / Frying / Chena etc.):

- Stage label spans both columns
- Style: `8px` · `font-weight: 800` · `letter-spacing: 0.07em` · `text-transform: uppercase` · `color: --amber`
- Background: transparent (no alternating tint)
- Padding: `10px 15px 3px` (extra top space, tight bottom)

Stage names come from the recipe data (Section header in `vajeeva-recipes.md`). There is no fixed vocabulary — render whatever label the data provides.

### 6.3 Shared sub-recipe — Aromatic Powder bottom sheet

When an ingredient table contains a footnote reference (`* Aromatic powder: same blend as …`):

**Footnote row** appears below the last ingredient row:
```
* Contains  [Aromatic Powder Blend ↗]    ← dashed amber pill, tappable
```

Tapping the pill opens a **bottom sheet** that slides up from the bottom of the screen:

```
[drag handle]
Aromatic Powder Blend         ✕
Shared sub-recipe · used in 8 recipes
─────────────────────────────────────
Store note: "Make in a small batch. Keeps 1 month airtight."
─────────────────────────────────────
Cardamom pods       3–4
Cloves              2–3
Black pepper        2–3
Cinnamon            2–3 inch
Dry ginger          2–3 inch
Edible camphor      2–3 crystals
─────────────────────────────────────
Method: Grind all together to a fine powder.
Use ¼–½ tsp per recipe.
```

Sheet closes on ✕ tap or drag down. The bottom sheet is positioned absolute within the phone/screen container, z-index above content.

### 6.4 Method step list

Each step:
- Step number: `20×20px` circle, `1.5px` border in `--green`, green text, `9px bold`
- Phase label (complex layout only): `8px` uppercase amber, displayed as a block above the instruction text
- Instruction text: `11px`, `line-height 1.5`, `--ink`
- Separator: `1px solid rgba(233,225,208, 0.7)` between steps; none on last

### 6.5 Source citation pill

```
[KK 10/54 ↗]
```

- Font: serif italic, `10px`, `--amber`
- Border: `1px solid rgba(198,144,47, 0.4)`, `border-radius: 4px`
- Tap: navigates to D4 Glossary Term screen, pre-loaded with the source key (BK / KK / ICMR etc.)
- Hover: `background rgba(198,144,47, 0.08)`

### 6.6 Contraindication card

Displayed when the recipe carries ≥ 1 contraindication. Never collapsed or hidden — always visible.

```
background: rgba(180,71,46, 0.07)
border-left: 3px solid --clay
border-radius: 0 6px 6px 0
padding: 9px 12px
margin: 10px 15px
```

Header: `⚠ Use with caution` — `9px bold uppercase`, `--clay`  
Body: condition list inline, `10px`, `rgba(180,71,46, 0.82)`, `line-height 1.7`

The four condition codes map to:

| Code | Display text |
|------|-------------|
| DM | Diabetes |
| OW | Overweight / Obesity |
| LI | Lactose intolerance |
| SD | Sedentary lifestyle with poor metabolism |

### 6.7 Yield & shelf life badges

```
[🫙 Makes 3–4 laddoos]   [📅 5–7 days]
```

- Background: `--sand`, border-radius `4px`, padding `4px 10px`
- Font: `10px`, `--ink60`
- Shelf life badge only rendered when data is present (~25 of 83 recipes have it)

### 6.8 Sanskrit name

- Position: immediately below English name in hero block
- Font: serif italic, `12px`, `--amber`
- In compact hero (Option 2): same line as meta (`"Sanskrit · S-24 · Solid"`)
- On recipe card in list view: shown as a third line, `10px` italic amber, truncated at 1 line

---

## 7. Filter Sheet Additions (B2)

Two new rows added to the existing filter sheet:

### 7.1 Sub-category filter

Multi-select pill group. Options:

**Solid:** Bread · Fried Bread · Pancake · Sweet · Vegetable · Salad · Rice · Baked · Steamed · Preserve  
**Liquid:** Panaka · Buttermilk · Soup · Milk-based  
**Semi-solid:** Porridge · Curd · Chutney · Halwa · Rice  

Pills shown are scoped to the currently active texture. Selecting "Bread" when on Solid browse shows only Bread recipes.

### 7.2 Safe-for-me filter

A single toggle row, off by default, session-scoped.

```
Safe for me       [toggle — off]
Hide recipes that conflict with your health flags.
```

Logic: if the user has health flags set (from A2 onboarding), toggling this on hides any recipe where the user's flag appears in the recipe's contraindication list.

If the user has no health flags set (A2 skipped or empty): the toggle is greyed out with label "Set health flags in Profile to use this filter."

---

## 8. Source Glossary (D4 — existing screen, extended)

D4 currently exists as a "Glossary term" screen. It needs to handle source citation entries in addition to ingredient/technique terms.

A source entry for `KK` (Ksemakutūhalam) contains:
- Full title
- Author / period
- Brief description of the text and its relevance to food/nutrition
- Chapter context for this recipe's citation (e.g., "Chapter 10 — Sweet preparations")

Source keys and their full names:

| Key | Full name |
|-----|-----------|
| BK | Bhojana Kutuhala (Siddhannaprakarana) |
| KK | Ksemakutūhalam |
| BP | Bhavaprakash Nighantu (Kritanna varga) |
| KN | Kaiyadeva Nighantu |
| CC | Charaka Chikitsasthana |
| CS | Charak Sutrasthana |
| AM | Ayurveda Mahodadhi (Pakvannavarga) |
| AS | Ayurveda sara Samgraha |
| BR | Bhaishyaja Ratnavali |
| SS | Sarngadhara Samhita (Madhyama Khanda) |
| MC | Morningstar — *Ayurvedic Cooking for All*, 2011 |
| GO | Gowans — *Food for Life*, 2009 |
| AYUSH | Traditional food recipes from Ayush systems of medicine |
| ICMR | ICMR-NIN Dietary Guidelines for Indians, 2024 |

---

## 9. Recipe Card (List View) — Changes

The recipe card in B1 (texture list) and search results gets two additions:

1. **Sanskrit name** — third line, `10px` serif italic amber, `max-width` truncated at 1 line with ellipsis
2. **Contraindication dots** — up to 4 small `5px` clay-coloured dots in the top-right corner of the card. Count of dots = count of contraindications. No label. Tap → detail screen where the full card is shown.

No other card changes. Yield, source, and shelf life are detail-level data, not card-level.

---

## 10. Cook Mode — No Changes

Cook mode behaviour is unchanged. The 4+ step threshold that triggers Option 2 layout is the same threshold that enables the "Start Cook" button. The phase labels and timers in cook mode are populated from the method steps data (to be defined per recipe during content authoring, not part of this spec).

---

## 11. Edge Cases

| Situation | Behaviour |
|-----------|-----------|
| Recipe has 0 contraindications | Contraindication card omitted entirely (no empty state) |
| Recipe has no shelf life data | Shelf life badge omitted; yield badge shown alone |
| Recipe has no Sanskrit name | Sanskrit name line omitted; English name takes full hero height |
| Recipe has no source citations | Source block omitted |
| Single-stage ingredients (most recipes) | Stage header rows omitted; flat table only |
| User has no health flags set | "Safe for me" toggle is greyed out in B2 with explanation label |
| Step count is exactly 4 | Option 2 (tabbed) — threshold is ≥ 4 |
| Aromatic powder blend in a simple recipe (Option 1) | Footnote pill still appears in ingredient table; bottom sheet behaviour identical |

---

## 12. Design Tokens (unchanged — reference)

```
--bone:  #F2EDE1   screen background
--sand:  #E9E1D0   dividers, alternating rows, badges
--cream: #FBF8F1   page background
--ink:   #2A251E   primary text
--green: #3E6B4F   CTAs, active states, step circles
--amber: #C6902F   Sanskrit name, source pills, stage headers, aromatic pill
--clay:  #B4472E   contraindication card, dots

--serif: "Iowan Old Style", "Book Antiqua", Palatino, Georgia, serif
--sans:  ui-sans-serif, system-ui, -apple-system, sans-serif
```

---

## 13. Files to Create / Modify

| File | Action |
|------|--------|
| Recipe detail screen | Modify — add all new sections per §4–5 |
| Ingredient table component | New — unit toggle, stage headers, footnote pill |
| Aromatic powder bottom sheet | New component |
| Source citation pill | New component |
| Contraindication card | New component (E1 exists — replace with this spec) |
| Sanskrit name slot | New — add to hero block and recipe card |
| Yield / shelf life badges | New component |
| Filter sheet B2 | Modify — add sub-category + safe-for-me rows |
| D4 Glossary screen | Modify — support source citation entry type |
| Recipe card | Modify — add Sanskrit name line + contra dots |

---

*Spec self-review passed: no TBDs, no contradictions between sections, threshold rule consistent throughout, all 16 fields have an assigned home.*
