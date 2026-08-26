import { Dimensions, StyleSheet } from 'react-native';

// The design's px values were authored on the prototype's 272px phone stage
// and ported 1:1, so raw values read ~30% small on a real ~390-430pt phone.
// Scale them to the device width so any phone shows the mock's proportions.
// Desktop (>= 768, Sidebar layout) keeps raw values — visually unchanged.
const GUIDELINE_BASE = 260; // prototype stage width the values were authored on
const PHONE_CAP = 320;      // largest phone logical width; scaling stops here
const DESKTOP_MIN = 768;    // useIsDesktop breakpoint

// Static read is fine: the app is portrait-only (app.json) and the desktop
// breakpoint only changes on a reload-sized window resize. `|| DESKTOP_MIN`
// guards non-browser contexts (static export) where width reads 0.
const w = Dimensions.get('window').width || DESKTOP_MIN;
export const scaleFactor = w >= DESKTOP_MIN ? 1 : Math.min(w, PHONE_CAP) / GUIDELINE_BASE;

/** Scale a design px value to the device, half-point precision. */
export function sc(v: number): number {
  return Math.round(v * scaleFactor * 2) / 2;
}

// Size-type props scaled by scaledSheet(). Deliberately excludes borderWidth
// (hairlines stay hairlines), flex/opacity/elevation, and shadow* (nested
// objects / design depth), and skips non-numeric values (e.g. '55%').
const SCALED_PROPS = new Set([
  'fontSize', 'lineHeight', 'letterSpacing',
  'padding', 'paddingHorizontal', 'paddingVertical',
  'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin', 'marginHorizontal', 'marginVertical',
  'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'gap', 'rowGap', 'columnGap',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'top', 'right', 'bottom', 'left',
]);

/**
 * Drop-in replacement for StyleSheet.create that scales every size-type
 * numeric prop with sc(). Layout structure (flex, %, borders) is untouched —
 * proportions stay, only absolute size scales.
 */
export function scaledSheet<T extends StyleSheet.NamedStyles<T>>(styles: T | StyleSheet.NamedStyles<T>): T {
  const out: Record<string, Record<string, unknown>> = {};
  for (const key of Object.keys(styles)) {
    const src = (styles as Record<string, Record<string, unknown>>)[key];
    const dst: Record<string, unknown> = {};
    for (const prop of Object.keys(src)) {
      const val = src[prop];
      dst[prop] = typeof val === 'number' && SCALED_PROPS.has(prop) ? sc(val) : val;
    }
    out[key] = dst;
  }
  return StyleSheet.create(out as unknown as T);
}
