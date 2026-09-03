# Admin outcomes — engagement, adherence & satisfaction

**Status:** proposed · **Date:** 2026-09-03
**Related:** [discovery-tags](2026-08-24-discovery-tags.md) · [home-filter-pills](2026-09-02-home-filter-pills.md)
**Prerequisite:** [condition-vocabulary](2026-09-03-condition-vocabulary.md) — adherence (§5) does not compute until patient conditions and recipe flags share one vocabulary; they do **not** today.

**Problem:** The admin is **write-only**. Recipes, tags, health flags, and Home
pills flow *out*; nothing flows *back*. The current `DashboardPage` proves it —
every number is about the *library* (total / published / drafts, by-category) and
the Users card reads "— / Coming soon". But **engagement, dietary adherence, and
satisfaction are outcomes on the patient's phone**, and the admin cannot see any
of them. You cannot manage what you cannot measure. This spec adds the missing
feedback loop: capture patient-side signals, compute the three outcomes at **two
altitudes** (cohort *and* per-patient), and tie each metric to a lever the admin
can already pull.

**Design stance:**
- **Measure to manage** — the goal is trustworthy *trends*, not perfect capture.
  Real-world cooking is never fully observable from software; we accept that and
  design for an unbiased-enough, laddered signal anchored by one explicit tap.
- **Two altitudes** — cohort analytics drive *content* decisions; per-patient
  views drive *care* decisions. "Per user" is a first-class requirement.
- **Offline-first** — the app already batches through `lastSyncAt` +
  `sync.routes.ts`. New signals ride the same sync channel; no chatty per-tap
  network calls.
- **Value-add, not extractive** — no UI whose only purpose is to detect behaviour.
  Every capture point must give the *patient* something (a cook history, a saved
  rating). The measurement falls out as a byproduct.
- **Health data → care-management + governance** — per-patient monitoring of
  health behaviour is a different product from anonymous analytics. Consent,
  access control, minimisation, and a supportive (never punitive) framing are
  part of the spec, not a footnote.

---

## 1. The three outcomes, defined for Vajeeva

| Outcome | What it means for a *patient* | Signal it needs | Exists today | Gap |
|---|---|---|---|---|
| **Engagement** | Come back and actually **cook**, not just browse | cook confirmations, return & repeat cadence, (later) views + cook-mode funnel | **Partial** — `User.lastSyncAt` (last-open proxy) + `SavedRecipe.savedAt` | No cook signal, no views, no repeat/return series |
| **Dietary adherence** | **Avoid** contraindicated food *and* **cook** the right food consistently | patient conditions × recipe flags; cook frequency vs. a plan | **Avoidance computable now** — `User.healthProfile` × `Recipe.healthFlags{condition,severity}` | Positive/plan adherence needs cook data **and** a "recommended set" denominator |
| **Satisfaction** | Happy with the recipe and how it turned out | explicit rating at the "made it" moment; implicit *saved-but-never-made* friction | **Nothing** — no rating/feedback model | Fully greenfield; needs one calm capture point |

The standout: **avoidance-adherence needs zero new instrumentation** — every saved
recipe carrying a `caution`/`avoid` flag for a condition in the patient's
`healthProfile` is already joinable from `SavedRecipe` — **once the codes align.**
They do not today: patient conditions, admin built-ins, and recipe flags use three
unrelated code sets, fixed by
[condition-vocabulary](2026-09-03-condition-vocabulary.md) (a hard prerequisite for
this outcome).

---

## 2. Two altitudes

**A. Cohort / library view** — *what content to fix.* Saves-vs-makes per recipe
(saved-but-never-made ⇒ steps too hard or wrong), makes over time, adherence by
condition (a condition with weak adherence ⇒ too few appealing safe recipes), which
Home pills drive makes. Feeds curation.

**B. Per-patient care view** — *how this patient is doing.* One page per patient:
- **Engagement:** last active, saves, makes, repeat cadence, a *"was active, now
  quiet"* flag.
- **Adherence:** safe vs. flagged saves/makes against *their* conditions; a "flags
  to review" list; consistency once cook data exists.
- **Satisfaction:** their ratings; unresolved friction (saved N, made 0).

The per-patient view is the care surface — and the one that needs §8 governance
drawn around it.

---

## 3. The keystone — two records

### 3a. `CookLog` (new) — the durable cook + satisfaction anchor
Mirrors `SavedRecipe` exactly (same shape, same precedent). One row per confirmed
make; the optional rating rides the same write.

```ts
// apps/api/src/models/CookLog.ts
const CookLogSchema = new mongoose.Schema({
  userId:   { type: ObjectId, ref: 'User',   required: true },
  recipeId: { type: ObjectId, ref: 'Recipe', required: true },
  madeAt:   { type: Date, default: Date.now },
  rating:   { type: Number, min: 1, max: 5 },   // optional — "how did it go?"
  note:     { type: String, default: '' },      // optional, short
});
CookLogSchema.index({ userId: 1, recipeId: 1 }); // NOT unique — repeats are the point
```

This one record answers **engagement** (a make happened; repeats = cadence),
**satisfaction** (rating/note), and half of **adherence** (they actually made it,
not just saved it). It is also patient-facing: it *is* the cook history.

### 3b. `UserEvent` (new, Phase 2) — the thin analytics stream
For the softer engagement signals a durable record shouldn't hold:

```ts
UserEvent { userId, type, recipeId?, ts }
   type: recipe_view · cook_mode_started · cook_mode_completed
```

Offline-batched: queue on device, **flush through the existing sync channel**.
Health-adjacent ⇒ minimal fields, purpose-scoped, no free-text of anything
sensitive. Introduced only when the cohort funnel (§9 Phase 2) needs it — `CookLog`
+ `SavedRecipe` + `lastSyncAt` already carry Phases 0–1.

---

## 4. Engagement model

This is the model the rest of the spec leans on, and it is deliberately **not**
"instrument the reading surface".

### 4a. Reading is not engagement — implicit read-depth is ruled out
Vajeeva recipes average **4–5 steps**, and the recipe detail page shows the full
method inline. The moment the page opens, every step is visible — there is no
scroll, no dwell gradient, nothing to measure. A "scrolled all steps / dwell"
signal is therefore **worthless here and is explicitly not built.** More
fundamentally: reading a five-step method *is browsing*, not cooking. The
engagement we care about (therapeutically) is **making the dish and coming back** —
neither of which the reading surface can reveal, at any recipe length. We do **not**
gate steps behind check-offs, tap-to-reveal, or on-page timers to force a signal;
that taxes every patient (worst, the confident ones) to detect five lines of text
and betrays the app's calm voice.

### 4b. The anchor — "I made this" (surface-independent)
The detail page shows all steps *and* Cook Mode offers a guided flow; a patient may
cook from either. The only signal that doesn't care which surface they read from is
**the patient telling us.** One calm affordance — "I made this" — placed in **both**:
- at the **end of the inline steps** on the recipe detail page (screen 2), for the
  reader who never opens Cook Mode; and
- at the **Cook Mode finish** (screen C2, already *"Finish → Save prompt"* — extend
  that same moment).

Either tap writes a `CookLog` row. This is the ground-truth-ish cook signal, and it
is honest: we *ask*, we do not infer.

### 4c. Value-add, not extractive — the cook history
The "I made this" tap must build something the *patient* wants, or it's just
surveillance they'll ignore. It creates a **cook history**: "You've made this 3
times", "Last made 2 weeks ago", "Make again". Same data, opposite feeling — the tap
feeds *their* record, and the admin's metric is the byproduct. The optional
"how did it go? ★" (satisfaction, §6) attaches to the same `CookLog` write, so one
calm interaction serves both outcomes.

### 4d. The observable core — return & repeat cadence (no design change)
Short recipes do not defeat cadence, and cadence needs no new capture UI:
- **distinct-day app opens** — from `lastSyncAt` / sync (Phase 0)
- **repeat make** — a second `CookLog` row for the same recipe (Phase 1)
- **re-open the same recipe across days** — `recipe_view` timestamps (Phase 2)

A recipe viewed once is a browse; the same recipe made twice, or opened across two
weeks, is real engagement — fully visible without touching the detail-page design.

### 4e. Cook Mode is a strong rung, not the definition — earn it on merit
Cook-Mode-only measurement is **incomplete and biased**: the patients most likely to
skip the guided flow are the confident, experienced ones — who for a therapeutic app
may be the *most adherent*. Treat `cook_mode_completed` as one strong rung, never the
sole truth. To lift Cook Mode adoption (richer signal for free), make it the better
way to cook — timers that fire notifications (F3), the prep-ahead nudge (F2), step
check-off, hands-free — never nag or force it.

### 4f. The engagement ladder
No single rung is load-bearing; report engagement as graded signals so no cohort is
invisible.

| Rung | Signal | Surface | Strength |
|---|---|---|---|
| Viewed | `recipe_view` | detail | weak (browse) |
| Intent | `SavedRecipe` | any | medium |
| Guided | `cook_mode_started → _completed` | cook mode | strong |
| **Confirmed make** | **`CookLog` ("I made this")** | **either surface** | **strongest** |
| Loyalty | repeat `CookLog` / rating | any | strongest |

---

## 5. Adherence model

### 5a. Avoidance — computable today
For a patient with `healthProfile = [c1, c2, …]`, any saved (§Phase 0) or made
(§Phase 1) recipe whose `healthFlags` include `{condition ∈ healthProfile,
severity ∈ {caution, avoid}}` is a flag to surface. No instrumentation; the app
already warns on the detail page (screen E1) — this is the admin-side view of the
same truth.

### 5b. Positive / plan adherence — needs a denominator
"Cooking the right food consistently" requires a **recommended set** to adhere *to*.
Today the closest thing is the `severity: safe` flags. Phase 4 defines a recommended
set per condition (or per patient — see §11) so adherence has a real denominator,
then computes within-plan make consistency (makes/week within the set), streaks, and
a per-patient adherence score. Requires `CookLog` (§3a).

### 5c. Views
- **Per-patient:** safe vs. flagged saves/makes; "flags to review"; consistency.
- **Cohort:** adherence by condition → exposes content gaps (which condition lacks
  appealing safe recipes) that feed the recipe backlog.

---

## 6. Satisfaction model

Greenfield. Capture at the **"made it" moment**, not in a survey: a single calm tap
— ★ (or 👍/👎) + optional short note — on the same `CookLog` write as "I made this".
Natural at Cook Mode finish (C2) and at the detail-page "made this" affordance. Never
a mid-scroll modal; dismissible; never blocks.

- **Explicit:** `CookLog.rating` / `note`, per recipe and per patient.
- **Implicit friction:** *saved-but-never-made* (a `SavedRecipe` with no `CookLog`
  after a threshold) — a soft dissatisfaction / friction signal, per recipe (fix the
  recipe) and per patient (intervene).

---

## 7. Levers — close the loop

Charts alone move nothing. The admin's **existing curation tools already are the
levers** — they've simply been operated blind. Tie each metric to an in-place action:

| Signal | Lever (already built) |
|---|---|
| Recipe saved-but-never-made | **Edit the recipe** (simplify steps) — the editor |
| Good recipe, low reach | **Feature it** via the [Home filter pills](2026-09-02-home-filter-pills.md) |
| Patient adherence flag | Review **health-flag coverage** + outreach (E1 already warns in-app) |
| Low satisfaction (recipe) | Revise it |
| Dormant / at-risk patient | Nudge / reminder (Phase 5) |

---

## 8. Governance — health data + per-patient

Non-negotiable, stated up front:
- **Consent & transparency** — patients are told what is tracked and why.
- **Access control** — a practitioner role; not every admin sees every patient's
  health behaviour.
- **Data minimisation + retention** — only what serves care; a defined retention
  window for the `UserEvent` stream (§11).
- **Framing** — supportive, never punitive. Avoidance flags are prompts to *help*, not
  to police. This matches the app's existing integrity (sources, evidence,
  contraindication warnings).

---

## 9. Phased rollout (each shippable)

**Phase 0 — Make existing signals visible. ✅ Dashboard built 2026-09-03.**
`GET /api/admin/stats` + reworked `DashboardPage`: active users (7/30d from
`lastSyncAt`), makes logged, saves, avg rating, makes-over-time (8-week bars),
most-cooked, and saves-vs-makes with the saved-but-never-made friction count.
**Per-patient view built** (`GET /api/admin/users/:id` + `UserDetailPage`, reached
from the Users list): per-patient engagement, satisfaction, and the adherence
**"flags to review"** from `healthProfile × healthFlags` — the care surface (§2B).

**Phase 1 — `CookLog` + "I made this" (the anchor). ✅ Built 2026-09-03.** Model
(§3a) + `POST/GET /api/sync/cooked` (batch, offline-flush) + `useCookLog`
(local-first) + the affordance on the detail page *and* Cook Mode finish (§4b) +
cook history (§4c) + the optional "how did it go?" rating (§6). Server now
accumulates makes. Not yet done: cross-device history hydration, and surfacing on
the admin dashboard (Phase 2).

**Phase 2 — `UserEvent` stream + engagement analytics.** Offline-batched
`recipe_view` / `cook_mode_*` (§3b). Cohort funnel, return-cadence depth,
per-recipe completion, dormant-patient flags.

**Phase 3 — Satisfaction surfacing.** Per-recipe and per-patient ratings; the
friction signal in both altitudes.

**Phase 4 — Adherence, full version.** Define the recommended set (§5b); within-plan
consistency, streaks, per-patient adherence score, cohort adherence-by-condition.

**Phase 5 — Levers / closed loop.** Nudge dormant/at-risk patients; "feature this
recipe" from analytics into the Home pills; content-gap → new-recipe workflow.

---

## 10. Acceptance criteria

- Dashboard shows patient outcomes, not just library counts; the "Users" card is live.
- A per-patient page exists showing engagement, adherence flags, and (as phases land)
  satisfaction.
- "I made this" on **both** the detail page and Cook Mode finish writes a `CookLog`;
  the patient sees a cook history; repeat makes are counted.
- No UI is added whose only purpose is to detect reading; implicit read-depth is not
  built.
- Avoidance flags compute from `healthProfile × healthFlags` with no new events.
- `UserEvent` flushes via the sync channel, not per-tap; fields are minimal.
- Per-patient health behaviour is behind the practitioner role.

---

## 11. Open decisions

- **Care-management vs product analytics (strategic).** The per-user requirement +
  `healthProfile` + a single named admin point to a *care-management* tool (a
  practitioner shepherding named patients). Confirm — it sets the data model, access
  control, and consent copy. This spec assumes care-management.
- **Recommended set: per-condition vs per-patient.** Per-condition is cheaper and
  curated once; per-patient (a prescription) is stronger but heavier. Start
  per-condition?
- **How hard to push Cook Mode** — merit-only (timers/notifications/check-off), or
  ever make it the default path? This spec says merit-only.
- **`UserEvent` retention window** — how long raw events live before roll-up.
- **Satisfaction scale** — ★1–5 vs 👍/👎. Lighter is calmer; 👍/👎 loses nuance.
