# Vajeeva UI Implementation Design
**Date:** 2026-08-21  
**Status:** Approved  
**Scope:** Pixel-perfect UI implementation across `apps/frontend` (Expo — iOS, Android, Web) and `apps/admin` (Vite + TailwindCSS 4), matching the three prototype files exactly.

**Prototype references:**
- `prototypes/vajeeva-prototype.html` — mobile phone layout
- `prototypes/vajeeva-desktop.html` — desktop/web layout
- `prototypes/vajeeva-admin-mockup.html` — admin panel

---

## 1. Monorepo Structure

```
vajeeva/
  apps/
    frontend/    ← renamed from mobile; Expo 54, iOS + Android + Web
    admin/       ← Vite + TailwindCSS 4, unchanged structure
    api/         ← Express + MongoDB + Zod, unchanged
  packages/
    types/       ← shared TypeScript types
```

`apps/mobile` is renamed to `apps/frontend`. All references in `package.json`, `turbo.json`, and workspace config updated accordingly.

---

## 2. Responsive Breakpoint

Single breakpoint: **768px**.

- `< 768px` → phone layout (bottom tab bar, single-column, full-screen modals)
- `≥ 768px` → desktop layout (left sidebar, multi-column grid, overlay modals)

Implemented via `useWindowDimensions` hook exposed as `useIsDesktop(): boolean` from `src/hooks/useIsDesktop.ts`. All layout-chrome components consume this hook. Screen content components are layout-agnostic.

---

## 3. Token Layer

**File:** `src/theme/tokens.ts` (replaces current `src/theme.ts`)

All values extracted exactly from the prototypes:

```ts
export const colors = {
  // Surfaces
  bone:       '#F2EDE1',
  sand:       '#E9E1D0',
  cream:      '#FBF8F1',

  // Text
  ink:        '#2A251E',
  ink2:       '#6E6656',
  muted:      '#9C9482',

  // Dividers
  line:       '#E5DDCC',
  line2:      '#D8CEBA',

  // Green (primary action)
  green:      '#3E6B4F',
  greenPress: '#335B42',
  greenSoft:  '#E4EDE3',
  onGreen:    '#FBF8F1',

  // Amber (Sanskrit / source accent)
  amber:      '#C6902F',
  amber2:     '#A9701F',
  amberSoft:  '#F4E8CE',

  // Clay (contra / caution)
  clay:       '#B4472E',
  claySoft:   '#F3E1D8',

  // Blue (liquid category)
  blue:       '#3B6BA0',
  blueBg:     '#E8F0FA',

  // Cook Mode dark theme
  cmBg:       '#1A1814',
  cmSurf:     '#26221C',
  cmSurf2:    '#302B24',
  cmText:     '#F0EAD8',
  cmMuted:    'rgba(240,234,216,0.42)',
  cmLine:     'rgba(240,234,216,0.08)',
  cmAmber:    '#C6902F',
  cmGreen:    '#5CAD78',
} as const;

export const fonts = {
  serif: 'IowanOldStyle',   // iOS native; Libre Baskerville on Android + web
  mono:  'SpaceMono',
  sans:  'System',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 14, lg: 18, xl: 24,
} as const;

export const shadows = {
  card: {
    shadowColor: '#2A251E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 3,
  },
  lift: {
    shadowColor: '#2A251E', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13, shadowRadius: 28, elevation: 6,
  },
} as const;
```

**Font loading** (`app/_layout.tsx`):
- iOS: `IowanOldStyle` exists as a system font — no loading needed
- Android + Web: load `LibreBaskerville_400Regular`, `LibreBaskerville_700Bold`, `LibreBaskerville_400Regular_Italic` via `@expo-google-fonts/libre-baskerville`
- At runtime, `fonts.serif` resolves to the correct family per platform

---

## 4. `apps/frontend` File Structure

```
app/
  _layout.tsx              ← Root: SplashScreen hold → auth gate → font loading
  auth/
    login.tsx
    signup.tsx
    onboarding.tsx
  (tabs)/
    _layout.tsx            ← Conditional: TabBar (mobile) OR Sidebar (desktop)
    index.tsx              ← HomeScreen
    saved.tsx              ← SavedScreen
    more.tsx               ← More tab → Settings / Profile
  recipe/
    [slug].tsx             ← RecipeDetailScreen (push, shared on both breakpoints)
  cook/
    [slug].tsx             ← CookModeScreen (full-screen modal)
  finish/
    [slug].tsx             ← FinishScreen (full-screen modal)
  source/
    [slug].tsx             ← SourceGlossaryScreen (push)

src/
  theme/
    tokens.ts

  components/
    layout/
      TabBar.tsx           ← Bottom nav: Home | Saved | More icons + labels
      Sidebar.tsx          ← Desktop: logo + nav items + user footer
      PhoneShell.tsx       ← Status bar area management

    shared/
      RecipeCard.tsx       ← List card: tile bg + EN name + Tamil italic + cook time + contra dots + chevron
      TexturePillar.tsx    ← Home pillar: illustration tile + name + subtitle + count + chevron
      ContraCard.tsx       ← Clay left-border card: ⚠ header + condition list
      IngredientTable.tsx  ← Alternating rows + stage separators + g/cup toggle
      StepList.tsx         ← Numbered green circle + phase label (amber caps) + step text
      SourcePill.tsx       ← Italic amber dashed-border button → source glossary
      SubRecipeSheet.tsx   ← Bottom sheet (mobile) / inline panel (desktop)
      TimerPill.tsx        ← cm-green border + start/pause/resume/done states
      CookDots.tsx         ← Dot nav: amber pill (current) / green-dim (done) / surf2 (future)
      ContraDots.tsx       ← Recipe card contra indicator (up to 4 clay dots)
      SearchBar.tsx        ← Pill search bar: icon + placeholder
      ContinueCookingCard.tsx  ← Green card: illustration + name + step + progress bar + play btn
      OfflineBadge.tsx     ← "Offline" leaf-icon pill
      FilterChip.tsx       ← Category chip: default / active (green) / safe-for-me variant
      SectionLabel.tsx     ← Mono caps label (28% ink opacity)
      IconButton.tsx       ← 34×34 cream circle button with shadow
      CTA.tsx              ← Full-width green button (14px bold, 14px padding)
      GhostButton.tsx      ← Centered ink-2 text button
      Disclaimer.tsx       ← 9.5px muted centred legal line

  screens/
    HomeScreen.tsx         ← greeting + search + continue card + 3 pillars + trust badge
    RecipeListScreen.tsx   ← filter chips + recipe card list (FlatList)
    RecipeDetailScreen.tsx ← hero + title + sources + badges + contra + ingredients + method + CTA
    CookModeScreen.tsx     ← dark theme, step machine, timer, swipe, wakeLock
    FinishScreen.tsx       ← completion ring + save CTA + shelf life
    SavedScreen.tsx        ← MMKV grid + offline badge + toast
    SourceGlossaryScreen.tsx ← source detail: eyebrow + title + blocks
    SettingsScreen.tsx     ← name + health profile checkboxes + save
    ProfileScreen.tsx      ← name + auth method + logout
    OnboardingScreen.tsx   ← 3-step wizard (welcome → conditions → done)
    LoginScreen.tsx        ← email/pass + Google + Phone OTP
    SignupScreen.tsx       ← name + email + pass + social

  hooks/
    useIsDesktop.ts        ← useWindowDimensions → boolean (≥768)
    useSavedRecipes.ts     ← MMKV saved set + save/unsave
    useCookSession.ts      ← MMKV step state + PATCH API fire-and-forget
    useOfflineSync.ts      ← NetInfo listener → POST /sync/saved delta
    useHealthProfile.ts    ← MMKV conditionCodes + filter helper

  offline/
    storage.ts             ← MMKV instance + typed get/set helpers
    sync.ts                ← pending-delta queue + sync-on-reconnect logic

  api/
    client.ts              ← Axios instance + JWT interceptor + refresh logic
    recipes.ts
    sources.ts
    user.ts
    sync.ts
```

---

## 5. Screen-by-Screen Pixel Spec (Mobile)

### HomeScreen
| Element | Spec |
|---|---|
| Status bar area | `sbar`: time left, signal right, `11px bold` |
| Logo row | 30×30 rounded square (green-soft + sprout icon) + serif 15px "Good morning / Vajeeva" + 34×34 avatar circle |
| Search bar | Cream pill, 1px line border, shadow, search icon + 11.5px muted placeholder |
| Continue cooking card | Green bg, 38×38 rounded tile (recipe illustration), bold name, "Step N of N", 3px progress bar (25% fill), 26×26 white play btn |
| Section heading | Serif 16px bold "What would you like today?" |
| Texture pillars × 3 | Cream card, 1px line border, shadow, 18px radius; 54×54 tile (amber/green/clay-soft bg); serif 16px name; 10px ink2 subtitle; 9px mono muted count; chevron |
| Trust badge | 9px mono muted + leaf icon + "grounded in classical texts + ICMR-NIN 2024" |
| Bottom tab bar | Cream bg, 1px line top; 3 items (Home/Saved/More), 9px bold label, 20×20 icon, active = green |

### RecipeListScreen
| Element | Spec |
|---|---|
| Header | Back btn + serif 18px title + recipe count subtitle + filter icon btn |
| Filter chips | Scrollable horizontal; 10.5px bold; active = green-soft bg + green border; "🛡 Safe for me" chip = green border + text always |
| Recipe card | Cream card, 15px radius, shadow; 50×50 tile (texture bg); serif 13.5px EN name; italic 10px amber Tamil name; 9px muted meta (category · time); chevron; contra dots top-right |
| Contra dots | Up to 4 × 5px clay circles, opacity 0.65, gap 2.5px |

### RecipeDetailScreen
| Element | Spec |
|---|---|
| Hero | 172px height, radial gradient green-soft→sand; back btn top-left; heart (clay) + share top-right |
| Title | Serif 22px bold, letter-spacing -0.01em |
| Tamil name | Serif italic 13px amber |
| Source section | "CLASSICAL SOURCES" 9px caps label (28% ink); italic amber dashed-border pills |
| Yield / shelf | Sand bg badge, 10px ink2, 4px 9px padding |
| Contra card | rgba(clay, 0.07) bg, 3px clay left-border, rounded right; "⚠ USE WITH CAUTION" 9px bold clay caps; 10px clay-84% body |
| Ingredient header | Serif 16px + g/cup toggle (sand bg, green active pill) |
| Ingredient table | `dit`: 11px; odd rows 45% sand tint; stage rows = 8px amber caps, transparent bg, no tint |
| Aromatic footnote | "* Some recipes reference" 9px muted + dashed amber italic pill btn |
| Method | Serif 16px "Method" + "N steps · cook mode" 9px label; numbered 20×20 green circle steps with 8px amber caps phase label above text |
| CTA | Full-width green btn, 14px 800-weight, play icon, 14px radius |
| Disclaimer | 9.5px muted centred |

### CookModeScreen
| Element | Spec |
|---|---|
| Progress bar | 2px height; amber→#E8B44A gradient fill; 0.5s ease transition |
| Status bar | cm-muted time + signal |
| Nav bar | 32×32 cm-surf circle close btn; dot nav; "N / total" mono right |
| Phase strip | 9px mono cm-amber 0.18em letter-spacing |
| Step text | Serif 20px bold cm-text, 1.38 line-height |
| Illustration | 94px height, 14px radius, bg per step colour; 76×60 SVG |
| Ingredient chips | "THIS STEP" 8.5px mono label; cm-amber border 30% + bg 7%; 10px pill chips |
| Heat indicator | 11px mono cm-muted; flame icon |
| Timer pill | cm-green 2px border + text; states: start / pause / resume / done ✓ |
| Footer nav | Prev: cm-surf bg + 1px cm-line border + 65% opacity text. Next: cm-green bg + dark text |
| Caption | 8px mono cm-muted centred, "screen stays awake · swipe to navigate · works offline" |
| Animations | Next → `step-r` (translateX 20→0, opacity 0→1, 0.2s). Prev → `step-l`. |
| Swipe | `touchstart`/`touchend` on body zone; threshold 44px |
| wakeLock | `navigator.wakeLock.request('screen')` on mount (web only) |
| Dot behaviour | Tap = jump backward only; future dots non-interactive |
| Prev dim | `opacity: 0.3` on step 0 |

### FinishScreen
- Dark theme (cm-* tokens)
- Top row: close btn + full progress bar (cm-green) + "Done" label
- Body centred: 76×76 ring (cm-green border + bg), checkmark SVG
- "Well made." serif 25px + sub (recipe name · step count · elapsed)
- Save card: cm-green header + cm-muted body + cm-green CTA btn
- "Not now" ghost button
- Shelf life: 8.5px mono cm-muted centred footer

### SavedScreen
- Toast (top, green bg, hidden until save): "Saved — available offline" + Undo
- "Saved" serif 18px + Offline badge (sand pill, leaf icon, 9.5px bold)
- 2-col grid: cream cards, 13px radius, 72px illustration tile, serif 12px name, italic 9px amber Tamil name, 9px muted meta

### SourceGlossaryScreen
- Status bar + back btn + "SOURCE" mono right
- Eyebrow: 8.5px amber bold caps "Classical text · ~16th century CE"
- Title: serif 19px bold; subtitle: serif italic 11px ink2
- Blocks: 9px caps label (30% ink) + 11px body; amber highlighted chapter reference; amber italic "also cited" list

---

## 6. Desktop Layout Divergences

At `≥ 768px`, the root layout renders `<Sidebar>` instead of `<TabBar>`. Screen content components are unchanged; only the chrome differs.

| Mobile | Desktop |
|---|---|
| Bottom tab bar | Left sidebar (240px, sand bg, 1px ink3 right border) |
| Full-screen push nav | View fade (opacity transition, 0.2s) |
| Hero: 172px hero image | Hero: 200px, wider radial gradient |
| RecipeDetail: single column scroll | RecipeDetail: `340px left col` + `1fr right col` (ingredients left, method right) |
| CookMode: full-screen modal slide | CookMode: `position:fixed` overlay fade |
| SubRecipeSheet: bottom sheet | SubRecipeSheet: centred modal overlay (same pattern as cook mode) |
| Tab bar icons | Sidebar: logo + nav items with text labels + user avatar footer |
| Search: in HomeScreen | Search: in Topbar |

---

## 7. `apps/admin` — Pages & Pixel Spec

### Sidebar (all pages)
- 240px width, sand bg, 1px ink3 right border
- Logo: 32×32 green square "V" + serif "Vajeeva" + "Admin" sub
- Nav items: 17px icons + text labels, 9px radius hover, green-bg active
- Footer: 32×32 amber avatar (initials) + name + "Admin" role

### Topbar (all pages)
- 58px height, cream bg, 1px ink3 bottom
- Serif 20px page title (left)
- Search input (200px, bone bg, 1px ink3 border, 8px radius) + "New Recipe" green btn (right)

### RecipeListPage
- Stats row: 4 cards (bone bg, 1px ink3 border, serif 28px number, 12px label)
- Filter tabs: bone bg container, white active tab with shadow
- Status filter dropdown
- Table: `2fr 1fr 1fr 80px 110px` grid; table-hd bone bg; alternating row hover; texture chips (solid=bone, liquid=blue-bg, semi=amber-bg); published/draft badges with dot prefix; Edit + Delete action btns

### RecipeEditorPage
- Back btn (ink2 colour) + "New Recipe" serif title + "Save draft" ghost + "Publish" green btn
- Two-column: `1fr 360px`
- Left: form cards (white bg, 1px ink3, 8px radius) — Basic Info / Ingredients / Cook Steps / Health Flags
  - Ingredient chip input: bone bg container, white chips with × btn
  - Step cards: draggable (⠿ handle), green circle number, step text, amber phase tag + heat tag
  - Health flag grid: 2-col checkboxes with ok/bad/caution colouring
- Right (sticky): Publish card (toggle + Save draft + Publish btns) + "App preview" label + preview card

### DashboardPage
- 3-col grid: Total Recipes card (serif 42px big number) + By Category (horizontal bar chart, green/blue/amber bars) + Recent Edits (dot timeline)

### SourcesPage, SubRecipesPage
- Same table pattern as RecipeList (columns adjusted for content)
- CRUD modal: white overlay card, form fields, Save/Cancel

### UsersPage
- Read-only table: name, email, auth providers, health profile tags, joined date
- No action buttons (no edit, no delete)

### HealthFlagsPage
- Single form: one card per ConditionCode (label input + description textarea)
- "Save all" green btn

### LoginPage (admin)
- Centred card on bone bg
- Vajeeva logo + "Admin" label
- Email + password inputs
- Green "Sign in" btn

---

## 8. Navigation Flow

### Frontend (Expo Router)
```
/ (root _layout)
  → if no auth token → /auth/login
  → if first login → /auth/onboarding
  → else → /(tabs)

/(tabs)
  ├── / (index) → HomeScreen
  ├── /saved   → SavedScreen
  └── /more    → More (Settings / Profile links)

/recipe/[slug]          ← push from anywhere
/source/[slug]          ← push from RecipeDetail
/cook/[slug]            ← full-screen modal from RecipeDetail
/finish/[slug]          ← replaces cook modal on last step
/auth/login             ← no auth guard
/auth/signup
/auth/onboarding
```

### Admin (React Router, already set up)
```
/login              ← public
/                   → RecipeListPage
/recipes/new        → RecipeEditorPage
/recipes/:id/edit   → RecipeEditorPage
/dashboard          → DashboardPage
/sources            → SourcesPage
/subrecipes         → SubRecipesPage
/users              → UsersPage
/health-flags       → HealthFlagsPage
```

---

## 9. Offline Layer

All logic in `src/offline/`:

| Key | Type | Set | Cleared |
|---|---|---|---|
| `saved:{slug}` | Full recipe JSON | On save | On unsave |
| `savedIds` | `string[]` | Login + sync | Logout |
| `healthProfile` | `ConditionCode[]` | Login + profile update | Logout |
| `cookSession` | `{slug, step, startedAt}` | Each step advance | Finish / abandon |
| `pendingDelta` | `{added[], removed[]}` | Offline save/unsave | After sync |

`sync.ts`: NetInfo listener → `isConnected = true` → POST `/sync/saved` with `pendingDelta` → clear delta on success.

---

## 10. What Does NOT Change

- `apps/api` — untouched
- `apps/admin/src/api/client.ts` — untouched
- Existing admin tests (17/17 passing) — must stay green throughout
- Existing mobile `src/api.ts` and `src/auth/` logic — carry over, update import paths only
