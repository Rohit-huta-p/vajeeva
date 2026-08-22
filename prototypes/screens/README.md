# Standalone screen references

Each file here is ONE screen from `../vajeeva-prototype.html`, lifted out of the
centered desktop device mock and re-hosted as a true full-viewport phone canvas
(edge-to-edge, no bezel, no desktop wrapper, no centering offsets). Every
margin / padding / type / color value in these files **is** the phone's actual
value — use them as the clean per-screen reference for RN pixel-matching.
Reference canvas width: **390px**.

Built by slicing the prototype, not by rewriting: the shared `<style>` block and
SVG symbol defs are copied **verbatim** into each file; a clearly-marked
`STANDALONE PHONE CANVAS OVERRIDES` block at the end of each style removes only
the desktop wrapper + device mock (body centering/padding, `.phone/.notch/.stage`
frame, off-canvas nav `transform`). No component value was changed. Prototype
interactions are stubbed to no-ops — these are static reference files.

| File | Prototype screen id |
| --- | --- |
| `home.html` | `#s-home` |
| `texture.html` | `#s-texture` |
| `detail.html` | `#s-detail` |
| `cook.html` | `#s-cook` |
| `finish.html` | `#s-finish` |
| `saved.html` | `#s-saved` |
| `glossary.html` | `#s-glossary` |
| `aromatic-sheet.html` | `#aroma-overlay` shown open over `#s-detail` |

## Viewing

Serve the repo root and open at a 390px viewport (device toolbar, or an iframe):

```
cd recipe-app && python3 -m http.server 8090
open http://localhost:8090/prototypes/screens/home.html
```

## Values the device mock was hiding (frame-dependent findings)

- **Stage was 272×600, not 390×~844.** All px values carry over unchanged
  (that was always the porting rule), but anything *proportional* — hero
  illustration vs. screen width, vertical breathing room on centered screens
  (finish, cook) — reads differently at real phone size. Judge proportions
  against these files, not the mock.
- **Screen corners:** the mock's `.stage` had `border-radius:32px` — screen
  corners were rounded by the device frame, not the design. A real phone is
  edge-to-edge; nothing in the app should round the outer canvas.
- **Bottom-sheet bottom radius 32 (`.bspanel`)** matches the mock's 32px stage
  corner — it existed to hug the device mock's rounded screen. On a real phone
  the sheet sits flush at the viewport bottom edge; the 32px bottom radius is a
  frame artifact, not a design value. (The RN `AromaticPowderSheet` currently
  copies it — flagged for the RN follow-up card.)
- **Status bar (`.sbar` / `.cm-sbar`, the "9:41" row) is fake in-DOM chrome.**
  On device this is system UI in the safe area; RN screens should not render it
  and should use safe-area insets instead. Kept in these files (same DOM as the
  prototype) — ignore it when measuring.
- **Off-canvas nav transform** (`.screen{transform:translateX(100%)}`) and the
  slide animations were mock navigation mechanics, not screen design.
- **Copy caveat:** the aromatic sheet's "used in 8 recipes" is placeholder
  prototype copy kept verbatim here. The app must never ship the literal 8 —
  it renders the API's `usedIn` (3 today) or omits the count (board rule).
