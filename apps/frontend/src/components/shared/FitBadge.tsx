import React from 'react';
import { View, Text } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconCheck, IconWarn, IconNo } from './icons';
import type { FitLevel } from '../../api/recipes';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * Health-fit pill for a recipe card (Safe / Caution / Avoid). Pure presentation
 * — gate rendering at the call site with `FEATURES.fitBadge` and a non-null
 * level so unassessed recipes show nothing. `compact` drops the label to an
 * icon-only chip (for very tight tiles).
 *
 * Labels are recipe-level, not personalised — they read the recipe's own
 * healthFlags, not the signed-in user's profile. When per-user matching lands,
 * "Safe" can become "Safe for you" here without touching callers.
 */
export function FitBadge({ level, compact = false }: { level: FitLevel; compact?: boolean }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  // Colour/label/icon per severity, built from the active palette.
  const CONF: Record<FitLevel, { label: string; bg: string; fg: string; Icon: typeof IconCheck }> = {
    safe:    { label: 'Safe',    bg: colors.green,     fg: colors.cream,  Icon: IconCheck },
    caution: { label: 'Caution', bg: colors.amberSoft, fg: colors.amber2, Icon: IconWarn },
    avoid:   { label: 'Avoid',   bg: colors.clay,      fg: colors.cream,  Icon: IconNo },
  };
  const c = CONF[level];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <c.Icon size={sc(10)} color={c.fg} />
      {compact ? null : <Text style={[s.label, { color: c.fg }]}>{c.label}</Text>}
    </View>
  );
}

const makeStyles = (_colors: Colors) => scaledSheet({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 999, paddingVertical: 3, paddingLeft: 5, paddingRight: 7,
    ...shadows.card,
  },
  label: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '800', letterSpacing: 0.1 },
});
