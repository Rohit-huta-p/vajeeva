# Dietary diary — the per-patient day-by-day record

**Status:** Phases 1–3 built — admin view is a **calendar heatmap** · **Date:** 2026-09-20
**Related:** [admin-outcomes](2026-09-03-admin-outcomes.md) · [prepared-photos](2026-09-09-prepared-photos.md)
**Builds on:** `CookLog` (makes + photos). The diary is a **day-level** layer over the
**event-level** makes — it does not replace them.

**Problem:** The dietitian needs a structured daily record per patient — Day N, date,
what was prepared **morning / afternoon / night**, daily **adherence**, the day's
**photos**, and a **reason for deviation / remarks**. Everything the app captures today
is a timestamped "I made this" event (`CookLog`), which has no notion of a *day*, a meal
*slot*, per-day *adherence*, or per-day *remarks*. This spec adds the thin day layer that
turns the makes already being collected into the diary, and surfaces it as a **calendar
heatmap** on the per-patient admin page (subsuming the prepared-photos "Preparations" list).

**Design stance:**
- **Reuse, don't duplicate.** Meal recipes and images come from the makes patients
  already log; only the genuinely day-level fields (adherence, remarks) are new. No
  parallel logging surface.
- **Low patient friction.** The diary falls out of the existing "I made this" + photo
  flow, plus one light once-a-day check-in — never a form to fill per meal.
- **The patient's day, not the server's.** Meal slot and calendar day are the patient's
  *local* perception, so both are computed on-device (local time) and stored as the
  patient's local day — no UTC-midnight drift.
- **Clinically meaningful counting.** "Day 1" is the start of *their plan* (a date the
  dietitian sets), not their signup date.
- **Health data → governance.** Remarks are patient free-text and diaries are care-team
  visible; inherits prepared-photos §8 (consent, practitioner role, deletion).

---

## 1. Decisions locked

1. **Adherence + remarks are patient-self-reported** via a light daily check-in; the
   **dietitian can amend** them (it's their clinical record).
2. **Meal slot = defaulted-from-time *and* patient-pickable** — the "I made this" / photo
   step pre-selects morning/afternoon/night from the cook time; the patient can override.
3. **Per-patient `programStartAt`** (dietitian sets it) drives "Day 1"; falls back to the
   account's `createdAt` until set.
4. **Adherence is a tri-state** — Followed / Partial / Deviated — paired with the reason.
   (Not a computed %, which would need a prescribed-plan denominator that doesn't exist.)
5. **The diary table subsumes the "Preparations" section** (prepared-photos §7); photos
   live in its Image column.

---

## 2. Data model

### 2a. `slot` on a make (`CookLog`)
```ts
// apps/api/src/models/CookLog.ts — add to CookLogSchema
slot:      { type: String, enum: ['morning', 'afternoon', 'night'], default: undefined },
localDate: { type: String, default: undefined },   // patient-local 'YYYY-MM-DD' at log time
```
Set on the client at log time, **defaulted from local cook time** (morning < 12:00,
afternoon 12:00–16:59, night ≥ 17:00) and overridable. Carried through the shared make
schema, `POST /api/sync/cooked` (§ prepared-photos merge-write), and `useCookLog`. The make
also stamps **`localDate`** (the patient-local day) so the diary buckets by the patient's own
calendar day rather than re-deriving it from a UTC timestamp.

### 2b. `DiaryDay` (new) — the per-day fields that aren't tied to one make
```ts
// apps/api/src/models/DiaryDay.ts
const DiaryDaySchema = new mongoose.Schema({
  userId:    { type: ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },   // patient-local 'YYYY-MM-DD'
  adherence: { type: String, enum: ['followed', 'partial', 'deviated'] },
  remarks:   { type: String, default: '' },       // reason for deviation / notes
  amendedByAdmin: { type: Boolean, default: false },
});
DiaryDaySchema.index({ userId: 1, date: 1 }, { unique: true }); // one row per patient-day
```
Upserted on `(userId, date)`. Filled by the patient's daily check-in; the dietitian can
amend (sets `amendedByAdmin`). Rides the offline sync channel like `CookLog`.

### 2c. `programStartAt` on `User`
```ts
programStartAt: { type: Date }, // dietitian-set; Day 1 = this date. Fallback: createdAt.
```

**Why a `date` string, not a `Date`:** the diary's day boundary is the patient's local
calendar day. Storing a local `YYYY-MM-DD` (computed on-device) keeps "which day" stable
regardless of server/admin timezone; the meal-slot bucket uses the same local clock.

---

## 3. Day numbering

`Day N = daysBetween(programStartAt ?? createdAt, entryDate) + 1`, computed from local
dates. The admin **calendar** shows **every day from the start through today**, so gaps (missed
days) are visible as dashed "no entry" cells and days not yet reached are muted.

---

## 4. Adherence

- **Self-reported tri-state** on the daily check-in: **Followed · Partial · Deviated**,
  with an optional **reason** when Partial/Deviated (this is the "reason for deviation").
- **Secondary computed signal:** the existing contraindication **flag** (patient
  `healthProfile` × recipe `healthFlags`, admin-outcomes §5a) shows alongside — a day
  whose dishes conflict with their conditions is badged even if self-reported "Followed".
- The dietitian can override the self-report (amend), which is marked as admin-amended.

---

## 5. Capture (patient app)

- **Meal slot** — a small segmented control (morning / afternoon / night) on the "I made
  this" / photo step, pre-selected from local time, overridable. Zero extra taps unless
  they disagree with the default.
- **Daily check-in** — one light prompt a day: *"How did today go?"* → Followed / Partial
  / Deviated, and a one-line reason if not Followed. Surfaced once per local day (e.g. on
  the finish screen after a make, or a dismissible Home nudge); editable later. Writes a
  `DiaryDay`; **offline-first**, flushed on the existing sync channel.
- Images and "which recipe" need **no new capture** — they're the makes + photos already
  logged.

---

## 6. Admin — the diary calendar

Per-patient page (`UserDetailPage`) renders the diary as a **calendar heatmap**: a month
grid where every program day is a cell coloured by that day's adherence, above a **detail
panel** for the selected day. A summary band (on-plan split, days logged, photos shared)
sits on top; month navigation is bounded to the program's span. This replaces the earlier
table draft and **subsumes the "Preparations" section** (prepared-photos §7).

- **Cells** — coloured by adherence (green Followed / amber Partial / red Deviated). A day
  with makes but no check-in yet is a distinct "cooked · no check-in" state; a day in range
  with nothing logged is a dashed "no entry" cell; days not yet reached are muted. A camera
  glyph marks days that have photos.
- **Detail panel** — the selected day's three slots (morning / afternoon / night) with the
  makes bucketed by `slot`, each dish's photos at full size (practitioner remove, §
  prepared-photos §7), and the contraindication flag on conflicting dishes.
- **Adherence** — an inline editor in the panel (Followed / Partial / Deviated); a
  dietitian change marks the day admin-amended. Works on a missed day too (upserts a
  `DiaryDay`).
- **Remarks** — the reason/notes, editable in the panel (saved on blur).
- **Export** — CSV of the diary (PDF later), since clinical records leave the tool. The CSV
  keeps the tabular Day/Date/Morning/Afternoon/Night/Adherence/Remarks/Photos shape.

**API:**
- `GET /api/admin/users/:id/diary` — assembles rows (makes grouped by local day → slot →
  recipe + photos, joined with `DiaryDay` for adherence/remarks and Day N), plus `startDate`
  (the Day-1 anchor) and `today` so the calendar can place and classify every cell.
- `PATCH /api/admin/users/:id/program-start` — set `programStartAt`.
- `PATCH /api/admin/users/:id/diary/:date` — dietitian amends adherence/remarks.
- All behind `requireAdmin` (practitioner role, admin-outcomes §8).

---

## 7. Governance

Inherits prepared-photos §8: care-team visibility is disclosed at capture; remarks are
patient free-text (health-adjacent) and live behind the practitioner role; account
deletion already removes `CookLog` + photos — **also delete the patient's `DiaryDay`
rows** in that path. Framing stays supportive, never punitive — "deviated" is a prompt to
help, not to police.

---

## 8. Phased rollout (each shippable)

**Phase 1 — data + admin read (built).** `CookLog.slot` + `localDate`; `DiaryDay` model;
`User.programStartAt`; `GET /api/admin/users/:id/diary` (now also returns `startDate` +
`today`); set-program-start + amend endpoints; account-deletion purge of `DiaryDay`. Server
assembles the diary.

**Phase 2 — admin view (built).** The **Dietary diary calendar** on `UserDetailPage` — a
month heatmap coloured by adherence + a per-day detail panel (meals, full-size photos,
inline adherence editor, remarks), a summary band, and CSV export; retires the Preparations
section.

**Phase 3 — patient capture (built).** Meal-slot segmented control on the finish-screen
make/photo step (defaulted from time); the daily adherence + remarks check-in; both
offline-first through the sync channel (`useDiary`, `DailyCheckIn`, `localDay`).

**Phase 4 — verify.** Done: `tsc` clean across api / admin / frontend, admin `vite build`
clean, api tests pass (slot + localDate persist, diary sync upsert/merge, admin assembly
with Day N + slot bucketing + flag, admin-only 403, amend, deletion purge). Pending: manual
end-to-end on a live stack (log makes across slots → cells populate; self-report → shows on
the calendar; export).

---

## 9. Acceptance criteria

- A patient's makes appear on the admin diary in the right day + morning/afternoon/night
  slot, with that day's photos in the Image column.
- Day numbering counts from the dietitian-set `programStartAt` (else signup), and missed
  days are visible.
- The patient can self-report Followed/Partial/Deviated + a reason once a day, offline;
  it surfaces (and is amendable) on the admin table.
- A contraindicated day is flagged even when self-reported "Followed".
- The diary exports to CSV.
- Account deletion removes `DiaryDay` rows alongside makes + photos.

---

## 10. Decisions & follow-ups

- **Empty-day rows — decided.** The calendar shows every day start→today; missed days are
  dashed "no entry" cells and not-yet-reached days are muted (no collapsing needed — the
  month grid stays compact). Multi-month programs page via month navigation.
- **Daily check-in location — decided.** Finish screen after a make (built). A dismissible
  Home nudge is a later add if once-per-day-on-finish proves too easy to miss.
- **One adherence per day — decided.** Per day, not per meal.
- **Export — CSV shipped.** A printable PDF diary is a possible follow-up.
- **Follow-up:** the diary GET returns only days with activity; the calendar derives gaps
  from `startDate`/`today`, so nothing more is needed there — but a future CSV/PDF that must
  include blank rows would fill the range server-side.
