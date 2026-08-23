import { Platform } from 'react-native';

export const colors = {
  bone:       '#F2EDE1',
  sand:       '#E9E1D0',
  cream:      '#FBF8F1',
  ink:        '#2A251E',
  ink2:       '#6E6656',
  muted:      '#9C9482',
  line:       '#E5DDCC',
  line2:      '#D8CEBA',
  labelFaint: 'rgba(42,37,30,0.32)',
  green:      '#3E6B4F',
  greenPress: '#335B42',
  greenSoft:  '#E4EDE3',
  onGreen:    '#FBF8F1',
  amber:      '#C6902F',
  amber2:     '#A9701F',
  amberSoft:  '#F4E8CE',
  clay:       '#B4472E',
  claySoft:   '#F3E1D8',
  blue:       '#3B6BA0',
  blueBg:     '#E8F0FA',
  cmBg:       '#1A1814',
  cmSurf:     '#26221C',
  cmSurf2:    '#302B24',
  cmText:     '#F0EAD8',
  cmMuted:    'rgba(240,234,216,0.42)',
  cmLine:     'rgba(240,234,216,0.08)',
  cmAmber:    '#C6902F',
  cmGreen:    '#5CAD78',
  cmGreenDim: 'rgba(92,173,120,0.15)',
} as const;

export const fonts = {
  // Lora (bundled assets/fonts, loaded in app/_layout.tsx) — same brand
  // serif on iOS, Android and web.
  serif: 'Lora',
  serifBold: 'Lora-Bold',
  serifItalic: 'Lora-Italic',
  // System monospace per platform ('SpaceMono' was never loaded, so mono text
  // silently fell back to the platform default — a serif on web)
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  sans: 'System',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 14, lg: 18, xl: 24,
} as const;

export const shadows = {
  card: {
    shadowColor: '#2A251E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  lift: {
    shadowColor: '#2A251E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 6,
  },
} as const;

// ── Theming ──────────────────────────────────────────────────────────────────
// `colors` above is the light palette (and stays the default `colors` export so
// screens not yet converted keep rendering light). Themed screens read the
// active palette from ThemeContext; the dark palette mirrors the warm cook-mode
// look (parchment text on a #1A1814 ground, lighter green/amber accents).
export type Colors = Record<keyof typeof colors, string>;

export const lightColors: Colors = colors;

export const darkColors: Colors = {
  ...colors,
  bone:       '#1A1814',
  sand:       '#26221C',
  cream:      '#231F18',
  ink:        '#F0EAD8',
  ink2:       'rgba(240,234,216,0.64)',
  muted:      'rgba(240,234,216,0.42)',
  line:       'rgba(240,234,216,0.10)',
  line2:      'rgba(240,234,216,0.16)',
  labelFaint: 'rgba(240,234,216,0.42)',
  green:      '#5CAD78',
  greenPress: '#4E9A68',
  greenSoft:  'rgba(92,173,120,0.16)',
  onGreen:    '#0C1A10',
  amber:      '#D4A24A',
  amber2:     '#C6902F',
  amberSoft:  'rgba(198,144,47,0.16)',
  clay:       '#D46A50',
  claySoft:   'rgba(180,71,46,0.22)',
  blue:       '#6BA0D0',
  blueBg:     'rgba(59,107,160,0.18)',
};
