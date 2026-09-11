# Prepared-dish photos — patients photograph what they cooked

**Status:** proposed · **Date:** 2026-09-09
**Related:** [admin-outcomes](2026-09-03-admin-outcomes.md) · [offline-full-download](2026-08-27-offline-full-download.md)
**Extends:** `CookLog` (admin-outcomes §3a). A photo is **not** a new entity — it
attaches to the existing "I made this" record. No feed, no posts, no new stream.

**Problem:** Today a make tells us *that* a dish was cooked (`CookLog`) and *how it
felt* (`rating`). Neither shows **what was actually made**. A photo of the finished
dish is the richest signal we can get short of standing in the kitchen: for the
**patient** it turns the cook history into a personal cookbook ("this is the dal I
made that turned out well"); for the **care team** it is direct, low-effort evidence
of adherence and technique that no rating can carry. This spec lets a patient add
photos to a make, view them, and — per the decision below — makes them visible to
their dietitian.

**Design stance** (inherits admin-outcomes §design stance):
- **Value-add first.** The album is the *patient's* — a growing record of what they
  cooked. Care-team visibility is disclosed, not the point of the UI. A capture point
  whose only purpose is to feed the admin gets ignored; this one feeds *their* kitchen.
- **Attach, don't invent.** Photos ride the existing `CookLog` make (one make = one
  cooking event). Same record answers engagement, satisfaction, adherence — now with
  a picture. No second data model.
- **Offline-first.** Capture never depends on a live network. The picked file is
  persisted **locally first** and uploaded on the existing sync flush — the same
  pending/`synced` batching makes and saved recipes already use. A hard quit mid-upload
  loses nothing.
- **Account-bound (a deliberate divergence).** Makes and ratings work as a guest and
  push on sign-in. A **photo does not** — you cannot share to a care team a photo with
  no patient behind it. Adding a photo requires an account; a guest is prompted to
  sign in *in place* at the moment they tap it.
- **Health data → consent + governance.** Care-team visibility makes these per-patient,
  health-adjacent images. Consent at capture, practitioner-role access, deletion, and
  EXIF stripping are part of the spec (§8), not a footnote — the same posture
  admin-outcomes §8 already commits to.

---

## 1. What a photo attaches to

**A single `CookLog` row — one cooking event.** Not the recipe, not the profile. This
one choice makes every surface a roll-up of the same records:

- **Recipe detail** → "your photos of *this* recipe" = photos across that recipe's makes.
- **Cooked tab** (§6) → "my kitchen" = photos across *all* makes, newest first.
- **Care surface** → "what this patient made" = photos across *their* makes.

`CookLog` is append-only ("repeats are the signal" — admin-outcomes §3a), so a photo is
pinned to the exact make it belongs to and never rewrites history. An optional
per-photo **caption** covers "too dry this time"; the make-level `note` field (already
plumbed end-to-end, no UI yet) stays free for a longer reflection.

---

## 2. Decisions locked

- **Visibility — shared with the care team / admin.** Photos surface on the per-patient
  care view (`UserDetailPage`, admin-outcomes §2B) alongside that patient's makes. This
  pulls in the full §8 governance (consent copy, practitioner role, deletion).
- **Account required to add a photo.** Capture checks auth; a guest sees a sign-in /
  sign-up **modal then and there**, and resumes capture on success. Makes and ratings
  stay guest-friendly — only photos gate.
- **Journal — a new 4th tab** ("Cooked"). Home · Saved · **Cooked** · More.

---

## 3. Data model

### 3a. The photo subdoc (new) — on `CookLog`

Reuses the shape of `Recipe`'s `ImageSchema` (`{ url, alt, order }`) but **adds
`publicId`** — mandatory for lifecycle (delete / replace / account-purge), which the
recipe gallery never needed and does not store.

```ts
// apps/api/src/models/CookLog.ts
const PreparedPhotoSchema = new mongoose.Schema({
  url:      { type: String, required: true },   // Cloudinary secure_url
  publicId: { type: String, required: true },   // for destroy() — §4, §8
  caption:  { type: String, default: '' },      // optional, short
  order:    { type: Number, default: 0 },
}, { _id: true });                              // _id so a single photo is addressable

// added to CookLogSchema:
  photos:   { type: [PreparedPhotoSchema], default: [] },  // ≤ MAX_PHOTOS (§4)
```

### 3b. Shared contract

```ts
// packages/shared — the make write/read schema gains photos[]
photos: z.array(z.object({
  url: z.string().url(), publicId: z.string(), caption: z.string().default(''),
  order: z.number().default(0),
})).default([])
```

**Phase 1 note (as built):** there is no shared make schema today, and `@vajeeva/shared`
resolves to built `dist`, so Phase 1 keeps the photo shape **API-local** — the Mongoose
`PreparedPhotoSchema` (§3a) plus a `sanitizePhotos()` guard in the make writer. The Zod
above is **promoted to `@vajeeva/shared` in Phase 2/3**, when the frontend first imports it.

Client mirrors: `CookMake` / `CookEntry` (`apps/frontend/src/api.ts`,
`apps/frontend/src/hooks/useCookLog.ts`) gain `photos`, plus a **local-only**
`pendingPhotos: { localUri, status: 'pending'|'uploading'|'failed', caption? }[]`
that never leaves the device — it holds `file://` URIs until upload resolves (§5).

---

## 4. Storage & upload (API)

- **New patient route — `POST /api/uploads`, `requireAuth` only** (not `requireAdmin`).
  The existing route stays admin-only at `/api/admin/uploads` for recipe images; we do
  **not** relax it (that would drop patient dishes into the admin recipe folder).
- **Extract the Cloudinary helper.** Pull `uploadToCloudinary` out of
  `apps/api/src/routes/uploads.routes.ts` into `apps/api/src/lib/cloudinary.ts`; both
  routes call it with different `folder`s. Patient folder: **`vajeeva/prepared/<userId>`**.
- **Strip EXIF/GPS.** Done by the **client re-encode** (§5, `expo-image-manipulator`)
  before the bytes ever leave the device, so stored originals are already clean — a server
  Cloudinary option would be a no-op on the stored original. (Belt-and-suspenders: deliver
  via a `strip_profile` transform — deferred.) Food photos carry home coordinates;
  non-negotiable for a patient app.
- **Limits:** reuse `image/*` + 8 MB (already enforced by multer); add `MAX_PHOTOS = 5`
  per make, enforced server-side on the make write.
- **Attach on the make write.** Extend `POST /api/sync/cooked`
  (`apps/api/src/routes/sync.routes.ts`) to accept `photos[]` per make. Because the
  offline client has no server id for a make, **upsert on the natural key
  `(userId, recipeId, madeAt)`** so photos added to an *already-synced* make land on the
  same row instead of forking a duplicate. (`madeAt` is the make's stable local id.)
- **Delete — `DELETE /api/sync/cooked/photo`** (`{ recipe, madeAt, publicId }`,
  `requireAuth`; mounted with the other cook-log ops under `/api/sync`): confirm the photo
  is on **this user's** make, `$pull` it, **then** `destroyFromCloudinary(publicId)` — so a
  foreign `publicId` can't be destroyed.
- **Orphan sweep.** An upload that succeeds but whose make write never arrives (user
  abandons) leaves a Cloudinary asset with no DB ref. A scheduled sweep destroys assets
  under `vajeeva/prepared/*` older than N days with no matching `CookLog.photos.publicId`.

---

## 5. Capture — and the abandonment problem

Capture is **one intent with several entry points and a resumable local draft**, not a
single do-or-lose moment.

**Dependencies (new to the frontend — none exist today):** `expo-image-picker` (camera
*or* library in one OS sheet, handles permission) and `expo-image-manipulator` (resize
to ~1440px / JPEG ~0.7 before upload — saves the patient's data and the Cloudinary bill).
An in-app `expo-camera` is **not** built in v1 — the OS sheet is lower-friction and
"choose from library" matters as much as live capture (people shoot food in their normal
camera, then attach).

**The flow, offline-safe:**
1. **Tap "Add a photo"** → if guest, present the sign-in/sign-up modal (decision §2),
   resume on success. Then open the OS picker (camera / library, multi-select ≤ 5).
2. **Persist locally *before* upload.** Write the picked `file://` URIs to the local
   `CookEntry.pendingPhotos` with `status:'pending'`, show them immediately
   (optimistic). A quit here loses nothing — they're on disk against the make.
3. **Upload on flush.** The sync worker uploads each pending photo to `POST /api/uploads`,
   swaps `file://` → `{url, publicId}`, moves it into `photos`, and includes it in the
   `/api/sync/cooked` write. Failures stay `failed` and retry on the next flush — mirror
   `useCookLog`'s existing `synced` batching, don't invent a new queue.

**Entry points (the answer to "they skip / go back / quit"):** the make row is the
anchor and the photo is always-optional, so the same intent can be picked up later from
several places:

| Where | When | File |
|---|---|---|
| **Finish screen** (primary) | right after the rating | `apps/frontend/src/screens/FinishScreen.tsx` — new card below the "How did it go?" block |
| **Recipe detail** | any revisit ("you made this N times") | `apps/frontend/src/screens/RecipeDetailScreen.tsx` — "Add photo" on the made-this area |
| **Cooked tab** | browsing the journal; a make with no photo | new tab (§6) — subtle "add photo" on photoless entries |
| Opt-in reminder | hours later ("how did your dal turn out?") | **deferred** — nudges are naggy in a patient app; low-frequency, dismissible, off by default if built |

**Never a blocker.** The photo card is skippable, "Not now" always present; finishing a
cook never depends on it.

---

## 6. Viewing — entry points

Ranked by value:

1. **Recipe detail — "Your photos" strip (primary).** Contextual: "here's what I made
   last time," helps repeat success. Renders through the existing `imageSource()` /
   `cloudThumb()` choke point + on-device cache (`apps/frontend/src/offline/images.ts`) —
   local file first, sized Cloudinary thumb otherwise. Same path recipe images already use.
2. **Cooked tab (4th tab) — the journal.** `app/(tabs)/cooked.tsx` + a 4th entry in
   `app/(tabs)/_layout.tsx`. A chronological gallery of makes (photo thumb, recipe name,
   "made 2 weeks ago"), newest first, from `useCookLog` / `GET /api/sync/cooked`. This is
   the emotional payoff that *drives* capture — people photograph food to have the album.
   Tapping a make opens its photos + rating + "make again".
3. **Finish-screen confirmation.** After adding, show the thumbnail + "Added ✓" so it's
   visibly landed.
4. **Care surface** (admin) — §7.

Naming: "Cooked" matches the existing copy ("Added to your cooked list", FinishScreen).
Alt: "Kitchen" / "Journal" — minor, §11.

---

## 7. Care surface (admin)

The home already exists — the per-patient care view at `GET /api/admin/users/:id` /
`apps/admin/src/pages/UserDetailPage.tsx` (reached from the Users list, behind
`requireAuth, requireAdmin`). Its **"Recent makes"** card already lists each make
(*name · ★ · "3d ago"*) from `recentMakes`, built in
`apps/api/src/routes/usersadmin.routes.ts` — which already carries the §8 note
("sensitive health-behaviour data"). Photos slot into data that surface already returns.
Two shapes, both worth building:

1. **Thumbnails in "Recent makes"** (minimum). Each make row gains a thumb (or a `+N`
   cluster for multiples), tap → lightbox. The engagement ledger, now visual — the literal
   answer to "where does the admin see them."
2. **A dedicated "Their kitchen" gallery** on the same page — a chronological grid of all
   their dish photos, each captioned recipe + date + rating, with a **flag badge when that
   recipe is contraindicated for their conditions** (the same `flags` already computed for
   the "Flags to review" card beside it). This is where a dietitian *assesses* — a 40 px
   row thumb is too small to judge a dish, and merging photo + adherence context is the
   point of care-team visibility.

**Plumbing:** add `photos` to the `recentMakes` DTO (`usersadmin.routes.ts` already maps
`{slug, nameEn, madeAt, rating}` — also emit `photos`). `recentMakes` is sliced to the
last 8 — fine for the ledger, but the gallery wants *all* makes-with-photos, so raise the
slice for photo'd makes or add a dedicated `photoMakes` field. Admin is web: thumbnails
are a plain `<img>` with a Cloudinary size transform (`…/upload/w_160,h_160,c_fill/…`) —
no `imageSource()` indirection like the RN side.

**Remove action.** Wherever a photo shows, the practitioner gets a remove control — reuse
`DELETE /api/cooked/photo` (§4), admin-invokable (the moderation-lite of §8).

**Not photo surfaces:** cohort stats / `DashboardPage` stay aggregate — at most a
"*N photos added this week*" count, never individual images.

This is the direct realisation of admin-outcomes §7 (patient adherence flag → review):
the practitioner can now *see* what was made, not just that it was.

### 7a. The per-recipe lens (a fork, not a default)

A different, valuable view lives in the *recipe* admin, not the user admin: **all the
photos patients made of one dish** — on `RecipeEditorPage` / `RecipeListPage`. It is a
*content / curation* signal (do real results match the hero image? do the steps produce
the intended dish?), feeding admin-outcomes §7's "edit the recipe" lever.

But it **aggregates many patients' health-adjacent photos into a content-editing surface**
seen by content admins, not the practitioner role §8 scopes patient data to. So it is a
governance decision, not a free add-on (§11):
- **v1 — per-patient care surface only.** Photos stay behind the practitioner role.
  Consistent with §8. Recommended.
- **Later — an anonymized per-recipe wall** (photos with no patient identity attached) for
  curation. A separate consent / anonymization call.

---

## 8. Governance — health data + per-patient

Slots into admin-outcomes §8; the visibility decision (§2) makes it binding, not optional.

- **Consent & transparency.** Capture says plainly, once and in settings, that photos are
  **shared with your care team**. No dark pattern — the share is the feature, so it's
  stated at the moment of adding, not buried.
- **Access control.** Photos sit behind the same **practitioner role** as the rest of the
  per-patient care view — not every admin sees every patient's images.
- **Deletion (patient-controlled).** A patient can delete any photo (`DELETE
  /api/cooked/photo`, §4) — Cloudinary asset **and** DB ref. Account deletion
  (`apps/api/src/routes/users.routes.ts`, already `deleteMany`s `CookLog`) must first
  gather every `photos.publicId` for that user and `destroy()` them — else the images
  outlive the account. Add this to the deletion path.
- **EXIF/GPS stripped** on upload (§4).
- **Retention.** Photos live with their `CookLog` row; deleted with the make or the
  account. No separate long-tail store.
- **Framing.** Supportive, never punitive — a photo is the patient sharing a win, not the
  admin auditing them. Matches the app's voice.
- **Moderation.** Because photos are care-team-visible (not public), heavy moderation is
  out of scope; the practitioner gets a remove action. Reassess only if a public/shared
  gallery is ever added (§11).

---

## 9. Phased rollout (each shippable)

**Phase 1 — storage + data (api). ✅ Built 2026-09-10.** `PreparedPhotoSchema` + `photos[]`
on `CookLog` (§3a); `apps/api/src/lib/cloudinary.ts` extract (`uploadToCloudinary` +
`destroyFromCloudinary`); `POST /api/uploads` (requireAuth, `vajeeva/prepared/<userId>`);
`photos[]` on the `/api/sync/cooked` upsert with merge semantics (§4);
`DELETE /api/sync/cooked/photo` (owner-scoped). 17 suites / 103 api tests green, incl. a
new `prepared-photos` suite. Deviations from plan: shape kept **API-local** (shared Zod
§3b promotes in Phase 2/3); EXIF via **client re-encode** (§5); delete path under
`/api/sync`. Server can store & serve photos; no client UI yet.

**Phase 2 — capture (frontend).** Add `expo-image-picker` + `expo-image-manipulator`;
FinishScreen photo card; local-first `pendingPhotos` persist + background upload on the
sync flush (§5); the sign-in modal gate (§2). A patient can add photos at the finish.

**Phase 3 — view (frontend).** Recipe-detail "Your photos" strip + "Add photo" re-entry;
the **Cooked** 4th tab journal (§6); finish-screen confirmation. Photos are visible and
capture has multiple entry points.

**Phase 4 — care surface + governance. ✅ Built 2026-09-10.** `photos` + a `photoMakes`
gallery on `GET /api/admin/users/:id`; **"Recent makes" thumbnails + the "Their kitchen"
gallery** with flag badges on `UserDetailPage` (§7); `DELETE /api/admin/users/:id/photo`
(practitioner remove → `$pull` + destroy); a consent line on the gallery; account-deletion
(`DELETE /api/users/me`) now destroys the patient's Cloudinary assets before dropping
makes; `scripts/sweep-orphan-photos.ts` (+ `npm run sweep:photos`, `--dry` to preview).
API tsc + 108 tests green (+5 new); admin tsc clean (note: the admin suite has unrelated
pre-existing failures, none in `UserDetailPage`). The per-recipe wall (§7a) stays the §11 fork.

**Phase 5 — verify.** `tsc --noEmit` clean across shared / api / admin / frontend; api
tests green (extend `uploads.test.ts`, `recipe-images.test.ts`, `sync.test.ts`); manual:
add on finish, quit mid-upload → resumes, delete, appears on the care view, EXIF gone.

---

## 10. Acceptance criteria

- A signed-in patient can add ≤ 5 photos to a make from the finish screen; a guest is
  prompted to sign in in place and resumes.
- Photos picked offline persist locally and upload on the next sync flush; a quit
  mid-upload loses nothing and retries.
- Photos are viewable on recipe detail, on the new Cooked tab, and confirmed on finish.
- A patient can delete a photo; the Cloudinary asset is destroyed, not just the ref.
- Account deletion destroys all of that patient's prepared-photo assets.
- Uploaded images carry no EXIF/GPS.
- The care team sees a patient's photos on `UserDetailPage`, behind the practitioner role,
  with consent disclosed at capture.
- Recipe-image upload (`/api/admin/uploads`) is unchanged and still admin-only.

---

## 11. Open decisions

- **Tab name** — "Cooked" (matches existing copy) vs "Kitchen" / "Journal". Assumed
  "Cooked".
- **Add-to-past-make reach** — is the natural-key upsert `(userId, recipeId, madeAt)`
  enough, or do we round-trip server ids on flush? Spec assumes upsert (fits the offline
  batch, no id plumbing).
- **Reminder nudge** — build the opt-in "add a photo?" reminder at all, or leave capture
  pull-only? Spec defers it.
- **Per-recipe photo wall (§7a)** — v1 keeps photos in the per-patient care surface only.
  A per-recipe curation wall aggregates patients' photos in the *content* admin — build it
  only anonymized, and only if curation needs it. Deferred; per-patient-only assumed.
- **Per-photo caption in v1** — ship the caption field now, or photos-only first? Field is
  cheap; UI can trail.
- **Video** — out of scope; note only that Cloudinary would support it at higher cost.
- **Public / "what others made" gallery** — explicitly **not** in scope; would reopen
  moderation (§8) and a different consent model.
