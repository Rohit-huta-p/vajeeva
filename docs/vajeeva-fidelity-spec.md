# Vajeeva fidelity spec — corrections from prototype pixel-match

Source of truth: `prototypes/vajeeva-prototype.html` (stage is 272px wide; we mirror
its exact px values at any device width). Home is the reference implementation:
`apps/frontend/src/screens/HomeScreen.tsx` (commit dee8cfe).

## Global corrections (apply to every screen)

- **Screen padding**: horizontal **14px** (not 18/spacing.lg). Section rhythm: column
  **gap 10** between blocks (use `gap` on the ScrollView contentContainerStyle).
- **Icons**: no emoji/text glyphs. Use `src/components/shared/icons.tsx` — all
  prototype line icons (1.7 stroke, round caps) + food illustrations
  (`IllLaddu/IllCup/IllBowl/IllHero`, `MkSprout`) + helpers
  `categoryTint(category)` / `<CategoryIll category=…/>` for tile tint + artwork:
  solid→amberSoft+laddu, liquid→greenSoft+cup, semi-solid→claySoft+bowl.
- **Colors**: tokens already match the prototype palette exactly; never hardcode
  new hex. Dark cook/finish theme = `cm*` tokens.
- **Cards**: cream bg + 1px `line` border + `shadows.card`. Radii: pillar 18,
  continue-card 16, list card 15, saved grid card 13, CTA 14.
- **Type scale** (serif = headings, weight 700): screen title 18, section head 16,
  card name 13.5 (list) / 12 (grid), greet 15. Sans small: meta 9–10, labels
  9px 700 uppercase letterSpacing. Mono: counts/captions 9px.
- **Section label** (`.dslabel`): 9px, 700, uppercase, letterSpacing .08em,
  color rgba(42,37,30,.28), marginBottom 7.
- **CTA**: green bg, radius 14, paddingVertical 14, font 13/800, with 15px SVG icon.
- **TabBar** (done in dee8cfe): SVG IconHome/IconBook/IconMore 20px, gap 3,
  label 9px/600, active green.

## Per-component exact values (from prototype CSS)

- **icobtn** (round icon button): 34px, radius 17, cream bg, 1px line border, shadow.
- **search**: padding 11/14, radius 999, gap 9, text 11.5, cream + line border + shadow.
- **pillar**: padding 10/12, gap 12, tile 54 radius 13, name 16 serif,
  sub 10 ink2 mt1, count 9 mono muted mt2, chevron 18 muted.
- **continue card**: green, radius 16, padding 10/12, gap 10; tile 38 radius 11
  rgba(255,255,255,.16); label `Continue · {name}` 12.5/800; "Step X of Y" 10
  opacity .85; progress 3px track rgba(255,255,255,.25) mt5; play 26px round cream.
- **contra card** (`.dcc`): bg rgba(180,71,46,.07), borderLeft 3 clay,
  radius 0/6/6/0, padding 9/11; header 9px/800 clay uppercase; body = ONE
  paragraph, conditions joined by " · ", 10px rgba(180,71,46,.84) lineHeight 1.7.
- **source pill**: 10px serif italic amber, border 1px rgba(198,144,47,.42),
  padding 3/9, **radius 4** (not 99/dashed), trailing ↗ 8px.
- **badges** (`.dbadge`): 10px ink2, sand bg, padding 4/9, radius 4.
- **ingredient table**: 11px; odd rows rgba(233,225,208,.45); cell padding 7/14;
  amount right-aligned ink2; stage row 8px/800 amber uppercase.
- **method step**: number circle 20px **outlined** 1.5 green (NOT filled), number
  9px/700 green; row gap 9, padding 7/0, borderBottom rgba(229,221,204,.7);
  phase 8px/800 amber uppercase mb2; text 11px lineHeight 1.5.
- **cook mode** (`cm*`): x-btn 32 round cmSurf + 1px cmLine border; dots 6px
  (active 20px wide pill, amber); phase strip 9px mono .18em amber; step text
  20px serif lh 1.38; ill block h94 radius 14; timer pill border 2 cmGreen
  radius 999 padding 7/13 mono 12/800; footer nav buttons radius 13 padding 13
  font 12.5/800 (prev cmSurf+border, next cmGreen with #0c1a10 text);
  caption 8px mono.
- **finish**: ring 76px **border 2** cmGreen bg rgba(92,173,120,.1); title 25 serif;
  sub 11 cmMuted lh1.55; card bg rgba(240,234,216,.04) border 1px
  rgba(240,234,216,.1) radius 14 padding 12/14 gap 7, header 12/800 cmGreen
  (sans!), body 10 cmMuted; CTA cmGreen text **#0c1a10** radius 14; shelf 8.5 mono.
- **saved grid** (`.rcard`): 2 cols gap 9; card radius 13 padding 7; image block
  h72 radius 9 categoryTint + CategoryIll ~60px; name 12 serif mt6; skt name 9
  italic amber; meta 9 muted mt5. Offline badge: sand pill, 9.5/700 ink2 + 11px leaf.

## Copy corrections (prototype wording)

- Greet: "Good morning" + small "Vajeeva" (two lines).
- Pillars: Solid / Liquid / Semi-solid with subs "Breads · sweets · snacks",
  "Drinks · soups · buttermilk", "Porridge · puddings · chutneys".
- Trust: "grounded in classical texts + ICMR-NIN 2024" (leaf icon).
- Search placeholder: "Search a recipe or ingredient…".
- Disclaimer: "Supportive dietary guidance · not a substitute for medical advice".
- Finish: "Well made." / "Keep it in your kitchen?" / "Saved recipes stay on this
  device and work completely offline." / CTA "Save recipe" (heart icon) /
  "Not now" / shelf "store airtight · keeps 5–7 days".

Owners: Pam = Home, RecipeDetail, Finish, Saved (+ shared atoms + icons lib).
Everything else (RecipeList, CookMode, Glossary, auth) per god's assignment — use
this spec + icons.tsx; don't fork styles.

## How to run the fidelity check

**Ports** (all three must be up):

| Port | What | Start with |
| --- | --- | --- |
| 4000 | apps/api (seeded, 15 recipes) | `cd vajeeva/apps/api && npm start` (check first — often already running) |
| 8081 | expo web | `cd vajeeva/apps/frontend && npx expo start --web` (ditto) |
| 8090 | static server for prototype + harness | `cd recipe-app && python3 -m http.server 8090` (repo parent root, so both share one origin) |

**1. Side-by-side harness** — `vajeeva/tools/fidelity-harness.html`, open
<http://localhost:8090/vajeeva/tools/fidelity-harness.html?screen=list>.
Renders the app (left) and the prototype (right) in two 390px iframes, so the
comparison is viewport-independent — works at any Chrome window size (macOS
fullscreen windows refuse `resize_window`; the harness sidesteps that). The
dropdown / `?screen=` param (home, list, detail, cook, finish, saved, glossary)
jumps both frames to the same screen; the "10px grid" button overlays a ruler
grid on both. Note the prototype's phone stage is 272px wide inside its frame —
eyeball structure and copy here, don't measure it.

**2. Computed-style probes — the PRIMARY evidence.** Screenshots are for
structure; px fidelity is proven by comparing `getComputedStyle` values on the
app against the prototype's CSS (this spec + `vajeeva-prototype.html`'s
`<style>` block are the reference numbers). In the browser console (or the
`javascript_tool` MCP tool on the app tab/iframe), locate elements by their
distinguishing computed value and dump the properties under test, e.g.:

```js
const all = [...document.querySelectorAll('div')];
const card = all.find(d => { const c = getComputedStyle(d);
  return c.borderRadius === '15px' && c.borderTopWidth === '1px'; });
const pick = (el, props) => Object.fromEntries(
  props.map(p => [p, getComputedStyle(el)[p]]));
pick(card, ['borderColor','backgroundColor','paddingTop','paddingLeft','gap']);
```

A screen passes when every spec value above matches computed output exactly
(colors come back as `rgb()` — convert the token hex). This is stronger than
eyeballing and is the documented standard; the harness is the human-friendly
complement, not the proof.
