# Vajeeva — Full Product Design
**Date:** 2026-08-21  
**Status:** Approved  
**Scope:** Mobile (iOS + Android + Web), Admin panel, API — complete execution from current partial state

---

## 1. Product Overview

Vajeeva is an Ayurvedic recipe app grounded in classical Sanskrit texts (Ksemakutūhalam, ICMR-NIN 2024) and modern nutritional science. It helps users browse, cook, and save traditional Indian recipes with personalised health guidance.

**Three surfaces:**
- **Mobile** — Expo 54 (React Native), iOS + Android + Web
- **Admin** — React 18 + Vite 5 + TailwindCSS 4 (content editors)
- **API** — Express + MongoDB + Zod (shared backend)

**Monorepo:** Yarn workspaces + Turborepo at `vajeeva/`

---

## 2. Design System (from prototype)

All three surfaces share one token set:

```
--bone:     #F2EDE1   background
--sand:     #E9E1D0   surface
--cream:    #FBF8F1   card / elevated
--ink:      #2A251E   primary text
--ink-2:    #6E6656   secondary text (mobile)
--muted:    #9C9482   tertiary / placeholder
--line:     #E5DDCC   divider
--line-2:   #D8CEBA   strong divider

--green:        #3E6B4F   primary action
--green-press:  #335B42
--green-soft:   #E4EDE3
--on-green:     #FBF8F1

--amber:      #C6902F   Sanskrit / source accent
--amber-2:    #A9701F
--amber-soft: #F4E8CE

--clay:      #B4472E   contra / caution
--clay-soft: #F3E1D8

--blue:      #3B6BA0   liquid category accent
--blue-bg:   #E8F0FA

--shadow:      0 4px 14px rgba(42,37,30,.08), 0 1px 3px rgba(42,37,30,.05)
--shadow-lift: 0 10px 28px rgba(42,37,30,.13), 0 2px 6px rgba(42,37,30,.06)
```

**Admin-only opacity tokens:**
```
--ink2: rgba(42,37,30,.55)   secondary text
--ink3: rgba(42,37,30,.18)   borders / dividers
--ink4: rgba(42,37,30,.06)   subtle fills
--r:    8px                  standard border radius
```

**Cook Mode dark theme tokens** (applied on `#s-cook` and `#s-finish`):
```
--cm-bg:    #1A1814                    main background
--cm-surf:  #26221C                    surface (buttons, close btn)
--cm-surf2: #302B24                    dots background
--cm-text:  #F0EAD8                    primary text
--cm-muted: rgba(240,234,216,.42)      secondary text / labels
--cm-line:  rgba(240,234,216,.08)      dividers
--cm-amber: #C6902F                    phase strip, timer, chips
--cm-green: #5CAD78                    next button, done dots, finish ring
                                       ↑ lighter than --green, specific to dark theme
```

**Typography:**
- Serif: `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`
- Sans: `ui-sans-serif, -apple-system, system-ui, sans-serif`
- Mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

**Recipe card tile background rule (by texture):**
- Solid → `--amber-soft`
- Liquid → `--green-soft`
- Semi-solid → `--clay-soft`

**Liquid category colour** (admin chips + dashboard bars): `--blue` / `--blue-bg`

---

## 3. Data Model

### Existing collections (extend)

**`users`** — add fields:
```ts
healthProfile: ConditionCode[]   // user's active conditions
cookSession?: {
  slug: string
  step: number                   // 0-indexed
  startedAt: Date
  updatedAt: Date
}
role: 'user' | 'admin'           // default 'user'
authProviders: ('email' | 'google' | 'phone')[]
phone?: string
googleId?: string
```

**`recipes`** — add fields:
```ts
sourceIds: ObjectId[]            // refs to sources collection
subRecipeIds: ObjectId[]         // refs to subrecipes collection
texture: 'solid' | 'liquid' | 'semi-solid'
category: string                 // Sweets, Breads, Snacks, Drinks, etc.
contraIndications: ConditionCode[]  // conditions to warn about
```

### New collections

**`sources`**
```ts
{
  _id: ObjectId
  slug: string
  title: string                  // "Ksemakutūhalam"
  titleSanskrit?: string
  author?: string                // "Ksema Sarma"
  era?: string                   // "~16th century CE"
  classification?: string        // "Pakavidhi"
  chapter?: string               // "10/54"
  aboutText: string
  whyItMatters: string
  citedInRecipes: string[]       // recipe slugs (denormalised for display)
}
```

**`subrecipes`**
```ts
{
  _id: ObjectId
  slug: string
  nameEn: string                 // "Aromatic Powder Blend"
  note?: string                  // "Make in small batch, keeps 1 month"
  ingredients: { name: string; quantity: string }[]
  method: string
  usedInSlugs: string[]          // recipe slugs (denormalised)
}
```

**`config`** (key-value store for admin-editable labels)
```ts
{
  key: 'conditionLabels'
  value: Record<ConditionCode, { label: string; description: string }>
}
```

### ConditionCode enum
```ts
type ConditionCode =
  | 'DIABETES'
  | 'OBESITY'
  | 'LACTOSE_INTOLERANT'
  | 'SEDENTARY'
  | 'PREGNANT'
  | 'LACTATING'
  | 'NUT_ALLERGY'
  | 'INFANT_8M'
```

---

## 4. API — New Endpoints

Base path: `/api`  
All authenticated routes require `Authorization: Bearer <jwt>`

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Email + password signup |
| POST | `/auth/login` | Email + password login |
| POST | `/auth/google` | Verify Google `id_token`, upsert user, return JWT |
| POST | `/auth/phone/verify` | Verify Firebase `idToken`, upsert user, return JWT |
| POST | `/auth/refresh` | Refresh JWT pair |
| POST | `/auth/logout` | Revoke refresh token |

**Google SSO flow:** Mobile → Google Sign-In SDK → `id_token` → POST `/auth/google` → API verifies with `google-auth-library` → upsert user → JWT pair.

**Phone OTP flow:** Mobile → Firebase Auth SDK → SMS OTP → Firebase `idToken` → POST `/auth/phone/verify` → API verifies with Firebase Admin SDK → upsert user → JWT pair.

### User profile

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Current user |
| PATCH | `/users/me` | Update name, healthProfile |
| GET | `/users/me/cook-session` | Get active cook session |
| PATCH | `/users/me/cook-session` | Update step (fire-and-forget from mobile) |
| DELETE | `/users/me/cook-session` | Clear on finish/abandon |

### Recipes

| Method | Path | Description |
|---|---|---|
| GET | `/recipes` | List published recipes (filter: `texture`, `category`) |
| GET | `/recipes/:slug` | Recipe detail (includes source + subrecipe refs) |
| GET | `/recipes/search?q=` | Name search (EN + Tamil, published only) |

### Sync

| Method | Path | Description |
|---|---|---|
| GET | `/sync/saved` | Get user's saved recipe IDs |
| POST | `/sync/saved` | Push `{added[], removed[]}` delta |

### Sources

| Method | Path | Description |
|---|---|---|
| GET | `/sources` | List all sources |
| GET | `/sources/:slug` | Source detail |

### Admin (role: admin required)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Recipe counts by status + texture |
| GET/POST | `/admin/recipes` | List all + create |
| GET/PATCH/DELETE | `/admin/recipes/:id` | Recipe CRUD |
| GET/POST | `/admin/sources` | Sources CRUD |
| GET/PATCH/DELETE | `/admin/sources/:id` | — |
| GET/POST | `/admin/subrecipes` | Sub-recipes CRUD |
| GET/PATCH/DELETE | `/admin/subrecipes/:id` | — |
| GET | `/admin/users` | List users (read-only) |
| GET/PATCH | `/admin/config/conditionLabels` | Edit condition display labels |

---

## 5. Mobile — Screen Inventory

### Navigation structure

```
Splash
├── Auth Stack (no valid session)
│   ├── LoginScreen
│   ├── SignupScreen
│   └── OnboardingScreen   ← health profile wizard (one-time, skippable)
└── Main Tabs (valid session)
    ├── Home
    │   └── HomeScreen
    ├── Browse
    │   ├── TextureListScreen      ← Solid / Liquid / Semi-solid pillars
    │   ├── RecipeListScreen       ← filter chips + contra-dots
    │   └── RecipeDetailScreen     ← detail + save + cook CTA
    ├── Saved
    │   └── SavedScreen            ← offline grid
    └── More
        ├── SettingsScreen         ← health profile edit
        └── ProfileScreen          ← name, logout

Full-screen Modal (any tab):
    ├── CookModeScreen
    └── FinishScreen

Push navigation:
    └── SourceGlossaryScreen

Bottom Sheet overlay:
    └── SubRecipeSheet
```

### Screen specs

#### HomeScreen
- Greeting: "Good morning · Vajeeva" (serif)
- Search bar → RecipeListScreen with query pre-filled
- "Continue cooking" card (visible if `cookSession` exists) → CookModeScreen at saved step
- Three texture pillars: Solid / Liquid / Semi-solid → TextureListScreen
- Trust badge: "grounded in classical texts + ICMR-NIN 2024"

#### TextureListScreen
- Header: texture name + recipe count
- Three pillars matching prototype (illustration + name + subtitle + count)
- Tap → RecipeListScreen filtered by texture

#### RecipeListScreen
- Filter chips: category chips + "🛡 Safe for me" (filters by user's healthProfile contra-indications)
- Recipe cards:
  - Illustration tile (colour by texture)
  - EN name (serif bold) + Tamil name (italic amber)
  - Cook time + category
  - Contra-dots: up to 4 clay dots = number of active contra-indications for this user
  - Chevron

#### RecipeDetailScreen
- Illustration hero: radial gradient `green-soft → sand`, back-left / action-right overlay buttons
- Back button, heart (save, clay tint), share
- EN name (22px serif bold) + Tamil name (italic amber)
- "Classical sources" section label (mono caps, 28% ink opacity) + source pills (italic amber, dashed-border) → SourceGlossaryScreen
- Yield badge (`🫙 Makes N`) + shelf life badge (`📅 Keeps N days`)
- **Contra card** (always visible if any flags apply): clay left-border, "⚠ Use with caution" header, conditions listed
- Ingredients section: "Ingredients" serif heading + g/cup toggle (green pill when active)
- Ingredient table: alternating row tint (45% sand); **stage/phase rows** = amber caps separator (transparent bg, no alternating) between ingredient groups
- Aromatic powder footnote: dashed amber pill → SubRecipeSheet
- Method steps (numbered green circle, phase label in amber caps above text)
- "Start Cook" green CTA button → CookModeScreen
- Disclaimer below CTA: "Supportive dietary guidance · not a substitute for medical advice" (9.5px muted, centred)

#### CookModeScreen
- Dark kitchen theme (uses `--cm-*` token set, see §2)
- Progress bar: amber→`#E8B44A` gradient, fills left-to-right per step
- Close (✕) button top-left → exits cook mode, goes **back in stack** (not to Home), clears timer
- Dot navigation: current dot = amber pill (width 20px), done = `rgba(cm-green, 0.5)`, future = `--cm-surf2`. **Tapping a dot only jumps backward** (future dots are non-interactive)
- Step label "N / total" (mono, right-aligned)
- Phase strip: mono 9px, `--cm-amber`, 0.18em letter-spacing
- Step text: serif 20px, `--cm-text`, 1.38 line-height
- Step transition animations: next → slide from right (`translateX 20px → 0`), prev → slide from left
- Illustration area: coloured bg per step (each step has a `illColor` hex)
- "This step" ingredient chips: amber border + amber text, pill shape
- Heat indicator: flame icon + heat level text (hidden on steps with no heat)
- Timer pill: `--cm-green` border + text; states: `· start` / `· pause` / `· resume` / `· done ✓`; tap to toggle; on done, tap resets
- Prev button: dims to `opacity: 0.3` on step 0
- Next button: `--cm-green` bg, dark text; last step reads "Finish ✓" → FinishScreen
- Swipe left (44px threshold) = next, swipe right = prev
- `navigator.wakeLock.request('screen')` on start
- Footer caption: `"screen stays awake · swipe to navigate · works offline"` (8px mono muted)
- On exit → PATCH `/users/me/cook-session` (step reached)

#### FinishScreen
- Dark theme (matches Cook Mode)
- Completion ring + checkmark
- Recipe name + step count + elapsed time
- "Save recipe" card → triggers save + show toast on SavedScreen
- "Not now" → Home
- Shelf life note

#### LoginScreen
- Three entry points: Email/password | Google | Phone OTP
- "Don't have an account?" → SignupScreen

#### SignupScreen
- Name + email + password
- Or Google / Phone
- On success → OnboardingScreen (first time) or Home

#### OnboardingScreen
- Step 1: Welcome (Vajeeva logo + brief copy)
- Step 2: "Do any of these apply to you?" — checkbox grid of ConditionCode labels
- Step 3: "You're all set" → Home
- Skippable ("Skip for now" — can edit in Settings)

#### SettingsScreen
- Edit name
- Edit health profile (same checkbox grid as onboarding)
- Save → PATCH `/users/me`

#### SavedScreen
- "Saved" heading + "Offline" badge
- 2-column grid of saved recipes (from MMKV cache)
- Empty state: "No saved recipes yet."
- Tap → RecipeDetailScreen

#### SourceGlossaryScreen
- "SOURCE" eyebrow (mono caps)
- Text era, title (serif), subtitle
- About / citation / why-it-matters / also-cited-in sections
- Loaded from `/sources/:slug`

#### SubRecipeSheet (bottom sheet)
- Handle bar
- Sub-recipe name + "used in N recipes"
- Note text
- Ingredient table
- Method paragraph
- Loaded from `/subrecipes/:slug`

---

## 6. Offline Strategy

**Library:** `react-native-mmkv` (fastest KV on RN; web via `localStorage` adapter)

**Cached data:**

| Key | Value | Set when | Cleared when |
|---|---|---|---|
| `saved:{slug}` | Full recipe JSON | User saves recipe | User unsaves |
| `healthProfile` | `ConditionCode[]` | Login + profile update | Logout |
| `cookSession` | `{slug, step, startedAt}` | Each cook step advance | Finish / abandon |
| `savedIds` | `string[]` | Sync on login | Logout |

**Sync on reconnect:**  
`NetInfo` listener → on `isConnected: true` → POST `/sync/saved` with pending delta (any saves/unsaves made offline).

**Offline indicators:**  
SavedScreen shows "Offline" badge always. RecipeList / Home show a subtle banner when no connection.

---

## 7. Admin Panel — Additions

Admin panel (`apps/admin`) is currently a static mockup. Wire everything to real API.

### Auth gate
- `/login` route (not behind auth)
- Login form → POST `/auth/login` → store JWT in `localStorage`
- All other routes: check JWT, redirect to `/login` if missing/expired
- JWT interceptor on Axios instance

### Views to wire

**Recipes list:**  
- Fetch GET `/admin/recipes`
- Filter tabs call with `?texture=` query
- Edit → recipe editor pre-filled
- Delete → DELETE `/admin/recipes/:id` with confirmation dialog

**Recipe editor:**  
- New: POST `/admin/recipes`
- Edit: GET `/admin/recipes/:id` pre-fill → PATCH on save
- Ingredients: chip input (existing UI) → save as `{name, quantity, unit}[]`
- Steps: drag-and-drop reorder (existing UI) → save with `order` index
- Health flags: map to `contraIndications: ConditionCode[]`
- Sources: multi-select from `/sources` list
- Sub-recipes: reference picker from `/subrecipes` list
- Publish toggle → `status: 'published' | 'draft'`
- App preview panel: live re-render from form state

**Dashboard:**  
- Fetch GET `/admin/stats` → recipe count, category breakdown, recent edits

**Sources view (new):**  
- Table: title, author, era, cited-in count
- CRUD modal: all source fields
- Calls `/admin/sources`

**Sub-recipes view (new):**  
- Table: name, ingredient count, used-in count
- CRUD modal: name, note, ingredients table, method textarea
- Calls `/admin/subrecipes`

**Users view:**  
- Table: name, email, auth providers, health profile tags, joined date
- Read-only (no edit)
- Calls `/admin/users`

**Health Flags view:**  
- Edit display labels + descriptions for each ConditionCode
- Single-form save → PATCH `/admin/config/conditionLabels`

---

## 8. Auth Strategy Detail

All three methods produce the same JWT pair (`accessToken` 15min, `refreshToken` 7d).

### Email + password
Already implemented. No changes needed.

### Google SSO
- Mobile: `expo-auth-session` + Google OAuth
- API: receive `id_token` → verify with `google-auth-library` → upsert user by `googleId` or email → return JWT pair
- New dep: `google-auth-library` on API

### Phone OTP
- Mobile: `expo-firebase-auth` (or `@react-native-firebase/auth`)
- Firebase project: enable Phone Auth provider, add iOS/Android app
- API: receive Firebase `idToken` → verify with `firebase-admin` SDK → upsert user by phone → return JWT pair
- New deps: `firebase-admin` on API, `@react-native-firebase/auth` on mobile

### Admin auth
- Same email/password flow, `role: 'admin'` required
- Admin login screen → JWT in `localStorage`
- API middleware: `requireAdmin` checks `req.user.role === 'admin'`

---

## 9. Current State vs Target

### API
| Area | Current | Target |
|---|---|---|
| Auth | Email/password JWT | + Google SSO + Phone OTP |
| User model | Basic | + healthProfile + cookSession + role |
| Recipes | CRUD + list + detail | + texture + category + sourceIds + subRecipeIds |
| Sources | ❌ | New CRUD |
| Sub-recipes | ❌ | New CRUD |
| Admin routes | ❌ | Full admin namespace |
| Config | ❌ | conditionLabels |

### Mobile
| Area | Current | Target |
|---|---|---|
| Auth screens | ❌ | Login + Signup + Onboarding |
| Home | ❌ | Real (pillars + resume card) |
| Texture browsing | ❌ | TextureListScreen |
| Recipe list | Partial | + contra-dots + Safe-for-me filter |
| Recipe detail | Partial | + contra card + source pills + g/cup + SubRecipeSheet |
| Cook mode | ❌ | Full CookModeScreen + FinishScreen |
| Source glossary | ❌ | SourceGlossaryScreen |
| Saved | Partial | + MMKV offline |
| Settings | ❌ | SettingsScreen (health profile) |
| Offline layer | Partial (savedIds API) | MMKV cache + NetInfo sync |

### Admin
| Area | Current | Target |
|---|---|---|
| Recipe list | Static mockup | Wired to API |
| Recipe editor | Static mockup | Full CRUD |
| Dashboard | Static mockup | Real stats |
| Sources | ❌ | New view |
| Sub-recipes | ❌ | New view |
| Users | ❌ | Read-only view |
| Health flags config | ❌ | New view |
| Auth gate | ❌ | Login + JWT guard |

---

## 10. Implementation Order (recommended)

1. **API — data model + new collections** (sources, subrecipes, config; extend users + recipes)
2. **API — Google SSO + Phone OTP auth**
3. **API — admin routes namespace**
4. **Mobile — MMKV offline layer + NetInfo sync**
5. **Mobile — Auth screens (Login, Signup, Onboarding)**
6. **Mobile — HomeScreen + TextureListScreen**
7. **Mobile — RecipeListScreen upgrades** (contra-dots, Safe-for-me)
8. **Mobile — RecipeDetailScreen upgrades** (contra card, source pills, g/cup, SubRecipeSheet)
9. **Mobile — CookModeScreen + FinishScreen**
10. **Mobile — SourceGlossaryScreen + SettingsScreen**
11. **Admin — Auth gate + wire recipe list + editor**
12. **Admin — Sources, Sub-recipes, Users, Health Flags views**
13. **Admin — Dashboard real data**

---

## 11. Key Dependencies to Add

### API
- `google-auth-library` — Google token verification
- `firebase-admin` — Firebase phone OTP verification

### Mobile
- `react-native-mmkv` — offline KV storage
- `@react-native-community/netinfo` — already installed ✅
- `expo-auth-session` — Google OAuth
- `@react-native-firebase/auth` — Phone OTP
- `react-native-gesture-handler` — swipe in cook mode

### Admin
- No new deps — wire existing Axios + React Query to real API

---

## 12. Out of Scope (this PRD)

- Push notifications
- Recipe sharing (deep links)
- Social features (likes, comments)
- Analytics
- Payments / subscription
- Multi-language UI (English + Tamil names on recipes is in scope; full UI i18n is not)
