# Vajeeva native device checklist — Expo Go pass (iOS + Android)

The web build @390px is pixel-verified against the prototype refs
(`prototypes/screens/*.html`). What's left is behavior only a real device
shows. Run the app in Expo Go on **one iOS and one Android phone** and walk
this list in order — it follows the user flow. Each item says where to look,
what "good" looks like, and what the known risk is.

Already fixed in code (verify, don't debug): items 1–2.
Cannot be fixed from the route layer / needs a decision: items 8–12.

## 1. Status-bar overlap — FIXED, verify (Android especially)

**Where:** open Recipe list, a glossary page (Sources → any text), and Cook mode.
**Expected:** the back button / "All Recipes" header, the glossary hero, and the
amber progress line at the top of Cook mode all sit **below** the status bar
with the parchment (or dark) background filling the strip behind the clock.
**Risk:** RN's core `SafeAreaView` is a no-op on Android; fixed by
route-level `react-native-safe-area-context` insets (commit `9f03489`). If
anything still tucks under the clock, it's a screen adding its own negative
margin — report the screen, don't tweak.

## 2. Status-bar icon color on dark screens — FIXED, verify

**Where:** enter Cook mode, then finish a cook (Finish screen).
**Expected:** clock/battery icons turn **light** on the dark screens and back
to dark when you leave (commit `949ee59`, `expo-status-bar`).
**Risk:** on some Android OEM skins the style flip lags a navigation; note the
device model if you see it.

## 3. Aromatic sheet vs home indicator (iOS) / gesture bar (Android)

**Where:** Recipe detail → tap "Aromatic Powder Blend ↗" under Ingredients.
**Expected:** sheet slides up flush with the screen bottom; the last line
("…Do not over-grind.") stays readable above the home-indicator bar.
**Risk:** the sheet is deliberately flush-bottom (per ref) and does **not**
add bottom-inset padding — on devices with a gesture bar the footer note may
sit uncomfortably close. If it's clipped or the bar overlaps text, that's a
Pam fix (sheet bottom inset), not a route fix.

## 4. Serif rendering — platform font swap

**Where:** every heading; compare the two phones side by side.
**Expected:** iOS uses system **Iowan Old Style**, Android loads
**Libre Baskerville**. Both should feel like the same design: same sizes,
same weight-700 headings, italic Sanskrit names in amber.
**Risk:** the two faces have different x-heights/metrics — headings may sit a
few px taller/shorter per platform. That's accepted; flag only clipped or
wrapped text (e.g. "What would you like today?" breaking to 3 lines, Cook
step text overflowing its area).

## 5. Small type on Android — 9px sans/mono + fractional line heights

**Where:** section labels (CLASSICAL SOURCES, CITED IN), card meta lines
("Solid · 21 min"), mono captions (recipe counts, "store airtight · keeps 5–7
days", Cook phase strip).
**Expected:** small but crisp and unclipped.
**Risk:** Android rounds fractional `lineHeight`/`letterSpacing` differently
than web/iOS — 9px labels with 0.72px letter-spacing can look cramped or clip
descenders. Also the mono token is Menlo on iOS / `monospace` on Android, so
mono blocks will differ slightly. Screenshot anything clipped.

## 6. Card depth — iOS `shadow*` vs Android `elevation`

**Where:** Home pillars, recipe list cards, saved grid cards, search bar.
**Expected:** a soft, subtle lift on both platforms.
**Risk:** the token shadows are iOS-tuned (`shadows.card`/`shadows.lift`);
Android renders via `elevation`, which is harsher and directional. Cards may
look flatter or the shadow darker/tighter on Android. Cosmetic — note it, and
we'll tune an Android-specific elevation if it reads wrong.

## 7. Gradients on native — `expo-linear-gradient`

**Where:** Recipe detail hero (green→sand wash) and the Cook-mode top
progress line.
**Expected:** smooth wash, no hard edge where the hero meets the page.
**Risk:** native gradient render can band on low-end Android displays and the
color stops can differ subtly from web. Verify the hero doesn't show banding
and the cook progress line stays a thin amber line, not a smeared bar.

## 8. Cook mode — swipe between steps (PanResponder) — NOT verifiable on web

**Where:** Cook mode; swipe left/right on the step area, also tap Prev/Next.
**Expected:** horizontal swipe advances/rewinds a step; a vertical scroll on
long step text does NOT trigger a step change; buttons always work.
**Risk:** `PanResponder` thresholds were only exercised with a mouse. Real
touch may need a larger dx threshold (accidental step-jumps while scrolling)
or may conflict with the Android back-gesture edge zones. Report as: gesture
felt (too sensitive / dead / conflicts with back gesture).

## 9. Screen stays awake during cooking — NOT implemented (backlog)

**Where:** Cook mode; leave the phone untouched past your auto-lock timeout.
**Expected (today):** the screen **will** dim and lock — `expo-keep-awake` is
not installed yet. This is a known gap, not a bug.
**Decision for god:** cooking with dirty hands is the core use case; probably
worth `useKeepAwake()` in Cook mode before release.

## 10. Android hardware/gesture back button

**Where:** with the aromatic sheet open, press Android back. Then from Cook
mode step 3, press back. Then from Finish.
**Expected:** back closes the **sheet** first (not the detail page); from
Cook, back should leave cook mode (ideally onto the detail page); Finish back
shouldn't re-enter a completed cook session.
**Risk:** the sheet is a custom component (not a native modal), so Android
back likely pops the **route** instead of closing the sheet. Note the actual
behavior for each of the three spots.

## 11. SVG icon crispness

**Where:** tab-bar icons, round icon buttons (back/heart/share), category
illustrations (laddu/cup/bowl), the leaf in the trust line.
**Expected:** 1.7px strokes render clean at each device's pixel density.
**Risk:** react-native-svg rasterizes differently per density bucket — look
for fuzzy strokes or clipped edges at the tile corners, especially on a
lower-DPI Android.

## 12. Saved recipes offline claim

**Where:** save a recipe (Finish → Save recipe), kill the app, turn on
airplane mode, reopen → Saved tab → open the saved recipe.
**Expected:** the card and detail render from device storage; the Offline
badge shows.
**Risk:** AsyncStorage behavior on device vs web localStorage; images are
inline SVG so nothing should be missing, but verify detail + cook mode open
fully offline.

---

**Reporting:** for each item answer pass / fail / looks-off + device model.
Screenshots for 4–7 and 11. Items 1–2 failing → Jim. Item 3 → Pam.
Items 8, 10 → Dwight. Items 5–7, 11 are tuning passes we'll batch once seen
on real hardware; 9 needs god's go-ahead to add the dependency.
