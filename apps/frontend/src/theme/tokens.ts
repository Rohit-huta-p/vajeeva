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
