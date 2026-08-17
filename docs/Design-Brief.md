# Design Brief — Ayurvedic Vajikarana Āhāra App

**For:** UI/UX Designer
**Working title:** *Vajikarana Āhāra* dietary app (name TBD — see Open Decisions)
**Prepared from:** three content documents — Solids, Liquids, Semi-solid sections (83 recipes total)
**Status:** onboarding brief — read this first, then we scope wireframes.

---

## 1. TL;DR (read this if nothing else)

A **discreet, trustworthy mobile app** that gives men undergoing Ayurvedic treatment for infertility a **clear, do-able set of supportive food recipes** — each one grounded in both classical Ayurvedic texts and modern nutrition guidelines.

It is essentially a **curated recipe library for a sensitive health context.** The design job is to make classical dietary knowledge feel **modern, calm, credible, private, and easy to actually cook** — without feeling clinical, embarrassing, or "ethnic-cliché."

The content is already structured on a clean, repeating schema (name → references → image → ingredients → method → yield → contraindications). **That schema is your recipe card and detail screen, handed to you.**

---

## 2. What the app is & why it exists

**What:** A mobile Ayurvedic dietary app focused on *Vajikarana Āhāra* — dietary practices that support male reproductive health. It provides food preparations with ingredients, measurements, methods, benefits, and guidance in a simple, patient-friendly format.

**Why:** This dietary knowledge today is scattered across classical Sanskrit texts and verbal clinical advice. There's no single, organized, practical digital resource. The app makes it **findable, understandable, and followable** for patients.

**One-line vision:** Bridge traditional Ayurvedic dietary wisdom and modern digital UX so guidance is accessible, practical, and sustainable to follow.

> **Design consequence:** This is not a lifestyle food app and not a clinical dashboard. It sits in between — *warm heritage credibility + modern app clarity.* Every screen should feel like it belongs to a trusted practitioner, not a diet-fad startup.

---

## 3. Who you're designing for

### Primary — the patient
A man undergoing Ayurvedic management for infertility. Design for this emotional reality:

| Trait | Design implication |
|---|---|
| **Sensitive, stigmatized topic** | Discretion by default. No loud "FERTILITY" branding on the home/lock screen or notifications. A neutral app name & icon. Nothing that outs him if a partner/colleague glances at his phone. |
| **Stressed / anxious / hopeful** | Calm, reassuring, non-alarming tone. Encouraging, never clinical-cold or shaming. |
| **Wants practical action** | He wants "what do I cook tonight," not a lecture. Get him to a do-able recipe fast. |
| **Mixed digital literacy & age (≈25–45+)** | Large tap targets, plain language, minimal jargon, forgiving navigation. |
| **Often cooking in a kitchen** | Step view must work hands-busy: big text, offline access, screen-awake mode. |
| **Privacy-conscious about health data** | Minimal data collection, clear privacy posture, ideally usable without an account. |

### Secondary — the clinician
Ayurvedic physicians / PG scholars / dietitians who **counsel patients and may recommend recipes.**

| Need | Design implication |
|---|---|
| Trust the source | Surface references & evidence prominently — they'll check. |
| Point patients to specific items | Shareable recipe (link/PDF), or "recommend" feature. |
| Speed | Search by ingredient, benefit, or classical name. |

> **v1 focus:** design for the **patient** first. Treat clinician features as a lens, not a second app — decide with product owner what's in v1 (see Open Decisions).

---

## 4. Design principles (the north stars)

1. **Discretion & dignity.** Sensitive topic → private-feeling, neutral, never embarrassing. This is the #1 differentiator.
2. **Credible, evidence-anchored.** Every recipe cites classical texts *and* modern nutrition (ICMR-NIN 2024). Make that visible — it's the trust engine.
3. **Calm & warm, not clinical.** Grounded, natural, reassuring. Avoid both hospital-sterile and new-age-gimmicky.
4. **Do-able above all.** A patient must be able to shop for and cook the dish. Clarity of ingredients, quantities, and steps beats decoration.
5. **Modern heritage.** Honor the Ayurvedic/Sanskrit roots with restraint and taste — not clip-art mandalas.
6. **Safety-first.** Contraindications (diabetes, obesity, lactose intolerance…) must never be buried.
7. **Accessible & inclusive.** Bilingual terms, readable type, works for older/low-literacy users, works offline.

---

## 5. The content model ⭐ (your card + detail screen)

Every one of the 83 recipes follows the **same fields.** This is the backbone of the UI. Design each field intentionally:

| Field | What it contains | Real examples from the content | Design notes |
|---|---|---|---|
| **Name (dual)** | A friendly English name **+** the classical/Sanskrit name in parentheses | "Royal blackgram stuffed parata *(Vedanika)*", "Pumpkin crunch bites *(Kushmanda Vataka)*", "Coconut Laddu *(Narikela modaka)*" | Show both. English = approachable; Sanskrit = heritage credibility. Decide primary vs. secondary emphasis. Support diacritics (ā, ṣ, ṛ). |
| **References** | 1–3 classical texts + a modern nutrition guideline | *Bhojana Kutuhala*, *Ksemakutuhalam*, *Charaka*, *Bhavaprakash Nighantu* + *ICMR-NIN Dietary Guidelines for Indians 2024* | The trust signal. Consider a subtle "Sources" affordance (expandable) so it's present but not cluttering. |
| **Image** | A food photo — but inconsistent sourcing | Some real photo URLs, many "*Image generated with use of AI*", some missing/broken links | ⚠️ **Biggest visual risk.** Sourcing is mixed & inconsistent. You need a plan: consistent photography, or a unified illustration style, or a graceful placeholder system. See §8. |
| **Ingredients** | List with **dual measurements** | "Barley flour – 80–100 gm (½ cup)", "Ghee – 4–6 ml (about 1 teaspoon)" | Always metric **+** household units. Ranges are common. Consider a units toggle or show both. Design for scannable shopping. |
| **Method** | Sequential steps; sometimes grouped into phases | Simple: 3–4 steps. Complex: dumplings have sub-phases (*Prepare Chena → Dough → First frying → Stuffing → Second frying → Syrup*) | Step-by-step "cook mode." Support **grouped/phased steps**. Support **alternative methods** (e.g. Baati: oven / air-fryer / pressure-cooker / pan). |
| **Yield** | Labeled "Total quantity" | "2–3 medium roti", "200 ml", "10–12 laddoos" | Small, consistent metadata chip. |
| **Contraindications** | Safety warnings, on ~sweets & dairy | "Diabetes / Overweight-Obesity / Lactose intolerance / Sedentary lifestyle with poor metabolism" | **Must be prominent & unmissable.** Warning treatment, not fine print. Tie to user's profile if personalization exists (§8). |

### Hidden metadata worth designing for (derivable from content)
- **Prep-ahead / long timings** — many recipes need overnight soaks, 6–8 hr hangs, or 3–4 day preserves (Amla Murabba). → A "**start the night before**" flag and total-time indicator.
- **Main ingredient** — barley, black gram, coconut, amla, ghee, milk recur heavily. → Powerful filter/browse facet.
- **Diet flags** — sweet vs. savory, dairy/lactose, "diabetic-unfriendly." → Filter chips + safety.
- **Cooking method** — steamed / fried / baked / roasted / no-cook drink. → Filter facet.

---

## 6. Information architecture

### The content, as delivered
- **Solids (44):** breads (roti/paratha/puri/baati), fritters (vada), sweets (laddu/modak/halwa-like), veg stir-fries, salads, baked biscuits/muffins, rice dishes, preserves.
- **Liquids (23):** traditional drinks (panaka), spiced curd/buttermilk, soups, milk-based drinks (ksheerapaka), payasa.
- **Semi-solid (16):** porridge (ksheera/yavagu), shrikhand, chutneys, halwa, puddings, breakfast cereals.

### ⚠️ IA recommendation
The source is organized by **texture (solid/liquid/semi-solid)** — that's an *author's* filing system, not how a patient thinks ("what can I eat for breakfast?", "something with amla," "a safe sweet"). 

**Keep texture as one filter, but lead discovery with patient-friendly facets:**

```
Home
├── Browse by category (Solids · Liquids · Semi-solids)   ← from source
├── Browse by main ingredient (Barley · Black gram · Coconut · Amla · Milk…)
├── Browse by type (Breads · Drinks · Sweets · Soups · Chutneys · Porridge…)
├── Browse by meal (Breakfast · Snack · Side · Drink · Dessert)
├── Filters: no-cook · make-ahead · diabetic-safe · dairy-free · quick
├── Search (English name · Sanskrit name · ingredient)
├── Saved / Favorites
├── Glossary (Sanskrit terms, ingredients)
└── About / Evidence / Disclaimer / Settings
```

Multi-faceted browse matters because 83 items is too many for one flat list but rich enough for real filtering.

> **✅ Decided (v1) — texture-first home** *(reverses the recommendation above).* Product owner: lead the home with the three source categories **Solid · Liquid · Semi-solid**, as large plain-language cards (*eat / drink / spoon*, subtitled so "semi-solid" never reads as jargon). Rationale: for a stressed patient, the fewest + most concrete choices win — shortest path to cooking is **texture → dish → detail → cook (3 taps)**. The multi-facet browse is **not discarded** — ingredient / type / meal / diet filters move *one level down*, inside each texture list, as an optional Filter sheet + gentle sub-type chips. **Safety is never skipped:** the flow always routes through Recipe Detail (contraindications) before Cook Mode. Revised IA:
>
> ```
> Home  →  [ Solid ]  [ Liquid ]  [ Semi-solid ]   ← three big doors + Search
>            │
>            └─ Texture list  ──(optional: sub-type chips · Filter sheet)
>                  └─ Recipe Detail (safety gate)
>                        └─ Cook Mode
> ```

---

## 7. Core screens & flows

Priority order for design:

1. **Recipe detail — the hero screen.** Renders the full content model (§5). Includes a **Cook Mode** (big steps, screen-awake, swipeable, works offline). This is where the app lives or dies.
2. **Recipe card** (used in every list/grid). Image + dual name + key metadata chips (type, yield, time, safety flag).
3. **Home / discovery.** Calm entry; a few curated rows + the browse facets. Reassuring, not overwhelming.
4. **Browse / category list + Filters.** Facets from §6.
5. **Search.** Across English name, Sanskrit name, ingredient. Forgiving of spelling/diacritics.
6. **Saved / Favorites.** Available offline (kitchen use).
7. **Onboarding (light & optional).** Sets tone & privacy; optionally capture health flags (e.g., diabetic) to power safety filtering — **skippable**, no account required to browse.
8. **Glossary.** Sanskrit/ingredient terms with plain-language meaning & pronunciation.
9. **About / Evidence / Medical disclaimer.** Trust + legal.
10. **Settings.** Units, language, text size, privacy.
11. **Login / Sign-up (optional).** Account for cross-device sync, favorites & stats — but **anonymous browse stays the default** (§12). Discreet: neutral branding, no condition wording.
12. **Stats / Insights.** Personal, private usage — recipes viewed/cooked/saved, streaks, and **time spent in the app** (§12.3).

**Primary flow:** Open → (skip/see home) → browse or search → recipe card → recipe detail → Cook Mode → save.
_Account flow (optional):_ Open → continue anonymously **or** sign up / log in → saved items merge & sync → … → Stats.

---

## 8. Key UX considerations & edge cases

- **Contraindication safety.** If onboarding captures conditions (e.g. diabetes), *warn or filter* unsafe recipes. Even without a profile, contraindications must be visually strong on the detail screen.
- **Image inconsistency (plan for this early).** Sources mix real photos, AI-generated images, and dead links. Options: (a) commission/standardize photography, (b) adopt one **illustration system** for food + ingredients (sidesteps sourcing & looks intentional), (c) a branded placeholder for missing images. Recommend deciding this before hi-fi.
- **Sanskrit & transliteration.** Names carry diacritics (Āhāra, Kṣīra). Pick fonts that render them; provide pronunciation in the glossary; make search diacritic-insensitive.
- **Dual measurements.** Always show metric + household, or a toggle. Handle ranges ("80–100 gm") gracefully.
- **Long/prep-ahead timings.** Surface "start the night before" and total time up front so patients aren't caught out mid-recipe.
- **Alternative methods & optional ingredients.** Content frequently offers "OR bake / OR air-fry" and "(optional)" items — design for variants and optionality, not a single rigid list.
- **Offline & kitchen ergonomics.** Saved recipes and Cook Mode must work with no signal; keep screen awake; big hit areas for greasy fingers.
- **Privacy.** Sensitive health context → minimize data, no ad-tracking, usable anonymously; be explicit about what's stored.
- **Medical disclaimer.** "Supportive dietary guidance, not a substitute for medical/clinical advice." Present but non-scary.
- **Empty/҂loading/error states.** No search results, no saved items yet, image failing to load — design them; they're frequent here.

---

## 9. Visual direction — a starting point (not a mandate)

Treat this as a mood to react to, not a spec. You own the visual language.

- **Overall mood:** calm · grounded · trustworthy · warm · natural. "**Modern Ayurveda**" — heritage credibility with contemporary restraint. Think a well-designed wellness/health-reference product, not a spice-box cliché and not a sterile clinic.
- **Color (feel, not final):** warm natural neutrals (bone, oat, clay) as the base; a calm herbal green and/or a warm turmeric-amber as accents; deep grounding tones for text. Avoid stereotypical "male health" cold blues and avoid all-white clinical. Reserve a clear color for **safety/contraindication** warnings.
- **Typography:** a warm humanist sans for UI; consider a refined serif for recipe names/Sanskrit to add heritage & authority. **Must support diacritics.** Prioritize readability at large sizes (older users, cook mode).
- **Imagery:** appetizing, natural-light, consistent treatment — or a cohesive illustration set (see §8). Consistency matters more than realism.
- **Iconography:** simple, friendly line icons; a small ingredient/step icon set adds warmth and aids low-literacy users.
- **Tone of voice:** warm, respectful, plain, encouraging, non-judgmental. Never clinical-cold, never preachy, never euphemistic-cutesy about the condition.
- **Motion:** gentle and calming; nothing flashy.

---

## 10. Suggested next deliverables (from you)

1. Confirm/refine **IA & core user flows** (§6–7).
2. **Low-fi wireframes** for the 10 core screens — validate the recipe detail + Cook Mode first.
3. **Content/image strategy** decision (photo vs. illustration vs. placeholder) — blocks hi-fi.
4. **Design system**: type scale, color, spacing, components (recipe card, chips, step list, safety banner, source block).
5. **Hi-fi** for the hero flow (home → detail → cook mode → save).
6. **Prototype** for a usability check with 3–5 target users.

---

## 11. Open decisions needed from product owner

These change the design meaningfully — please get answers before hi-fi:

- **App name & icon** — must be discreet. (Not yet chosen.)
- **Language(s)** — English only, or multilingual? (A Kannada term already appears in content; regional relevance is likely.)
- **Personalization** — pure reference library, or a profile (conditions → safety filtering, maybe a daily plan/tracker)?
- **Accounts** — ✅ *Decided:* login / sign-up **in v1**, but **anonymous-first preserved** (account optional — powers sync + stats). Open: auth method (email / phone / social). See §12.
- **Usage analytics / time-tracking** — ✅ *Decided:* track **time spent** + engagement for the Stats screen. Open: local-only vs synced, opt-in vs default, retention — must reconcile with §4.1 discretion & §8 privacy (see §12.4).
- **Clinician features in v1?** — recommend/share to patient, or defer.
- **Content ownership** — who maintains the 83 recipes; is a CMS needed; how are images licensed/sourced?
- **Scope of v1** — browse-only MVP, or with personalization/plan?
- **Monetization** — free/clinic-distributed vs. paid (affects ads/privacy stance).

---

## 12. Addendum — Accounts, Stats & Time-Tracking (v1 update)

> Product-owner additions after the onboarding brief. **These add auth + usage data to a privacy-sensitive app — read §12.4 before hi-fi.** Anonymous browse stays the default; accounts and tracking are *additive, never gates.*

### 12.1 Login / Sign-up
Optional. Never blocks browsing or cooking. Discreet throughout (neutral name, no condition wording, safe if glanced at on a lock screen).

**Screens:**
- **Auth choice** — "Continue without account" (primary, prominent) · Sign up · Log in.
- **Sign up** — email or phone · OTP verify (preferred) or password · minimal fields only.
- **Log in** — identifier + OTP / password · "forgot".
- **Account / Profile** — edit health flags (§8 safety), units/language, **sign out**, **delete account & data** (make this easy — it earns trust).

**Rules:** anonymous → account **merge** (saved items carry over). Avoid social login — it leaks identity/contacts in a stigmatized context — unless PO insists.

### 12.2 Stats / Insights
Personal, private, encouraging — **never shaming** (§4.3). Own tab or nested under *More*.

**Sections:**
- **Time spent** — today · this week · streak (see §12.3). Hero of the screen.
- **Activity** — recipes viewed · cooked (Cook-Mode completions) · saved.
- **Breakdown** — by category / main ingredient / meal (what he actually cooks).
- **Consistency** — days active, gentle streak, weekly trend. Calm viz, no red "you failed" states.
- **Empty state** — new / anonymous users: "Start cooking to see your insights."

### 12.3 Time spent by user ⭐ (explicit requirement)
Capture all, surface the useful:

| Metric | Meaning |
|---|---|
| Session time | app in foreground per open |
| Daily / weekly total | sum of sessions |
| Per-recipe view time | time on a detail screen |
| Cook-Mode active time | time actually cooking (screen-awake) |
| Streak | consecutive active days |

Surfaced on **Stats (primary)** + an optional subtle streak chip on Home. Timers run **local-first**; sync only when logged in.

### 12.4 Privacy reconciliation (do not skip)
Directly tensions §4.1 (discretion) & §8 (minimal data). Resolve before hi-fi:
- Anonymous browse = **default**; account is **optional**.
- Tracking **local-first**; server-sync only when logged in; **opt-in**, togglable in Settings.
- **No** ad-tracking, **no** third-party analytics SDKs.
- Easy data **export + delete**. Discreet notifications (no health wording).

### 12.5 New open decisions
- **Auth method** — email vs phone vs social (recommend email / phone OTP).
- **Stats storage** — device-only vs account-synced; retention window.
- **Stats in v1 or fast-follow?** — adds tracking infrastructure.

### 12.6 Planned screen inventory (the plan)
`✅` = v1 · `⭐` = added this update.

| # | Screen | v1 | New |
|---|---|:--:|:--:|
| 1 | Recipe Detail (hero — renders §5) | ✅ | |
| 2 | Cook Mode (big steps, offline, screen-awake) | ✅ | |
| 3 | Recipe Card (component, every list/grid) | ✅ | |
| 4 | Home / Discovery | ✅ | |
| 5 | Browse + Filter sheet | ✅ | |
| 6 | Search (English · Sanskrit · ingredient) | ✅ | |
| 7 | Saved / Favorites (offline) | ✅ | |
| 8 | Onboarding (light, skippable) | ✅ | |
| 9 | Glossary | ✅ | |
| 10 | About / Evidence / Disclaimer | ✅ | |
| 11 | Settings | ✅ | |
| 12 | **Login / Sign-up + Account** | ✅ | ⭐ |
| 13 | **Stats / Insights** | ? | ⭐ |
| — | System states — image placeholder · empty · loading · offline · units toggle · safety banner · sources sheet | ✅ | |

---

## 13. Appendix

### Inventory
| Section | Count | Contains |
|---|---|---|
| Solids | 44 | breads, fritters, sweets, veg dishes, baked goods, rice, preserves |
| Liquids | 23 | drinks (panaka), curd/buttermilk, soups, milk drinks, payasa |
| Semi-solid | 16 | porridge, shrikhand, chutneys, halwa, puddings, cereals |
| **Total** | **83** | |

### One recipe in the schema (example — for layout reference)
> **Coconut Laddu** *(Narikela modaka)*
> **Sources:** Kṣemakutūhalam 10/54 · ICMR-NIN Dietary Guidelines for Indians 2024
> **Image:** photo
> **Ingredients:** Grated coconut 40–50 g (¼ cup) · Milk 30–40 ml · Ghee 10–15 ml (2–3 tsp) · Rock sugar powder 15–20 g · Cardamom powder 2–3 g · Dry ginger powder 2–3 g
> **Method:** cook coconut in milk → roast in ghee → make sugar syrup to binding consistency → combine with spices → shape laddus.
> **Yield:** 3–4 medium laddoos · keeps 5–7 days
> **Contraindications:** Diabetes · Overweight/Obesity · Lactose intolerance · Sedentary lifestyle
```
This single record touches every UI element you'll build:
name (dual) · sources · image · ingredient list (dual units) · steps · yield · shelf-life · safety.
```
