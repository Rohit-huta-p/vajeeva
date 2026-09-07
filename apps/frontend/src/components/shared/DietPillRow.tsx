import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { scaledSheet, sc } from '../../theme/scale';
import type { DietPill } from '../../hooks/useDietPills';

/**
 * Horizontal scrollable row of diet-tag pills on the Home screen.
 * Each pill deep-links to the recipe list filtered by that diet code.
 * Flat one-tap only — no dropdowns.
 */
export function DietPillRow({
  pills,
  onSelect,
}: {
  pills: DietPill[];
  onSelect: (code: string) => void;
}) {
  const s = useThemedStyles(makeStyles);

  if (pills.length === 0) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Diet</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.row}
        contentContainerStyle={s.rowContent}
      >
        {pills.map(p => (
          <TouchableOpacity
            key={p.code}
            style={s.pill}
            onPress={() => onSelect(p.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={p.label}
          >
            <Text style={s.pillLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  wrap: { gap: sc(6) },
  label: {
    fontSize: 10,
    fontFamily: fonts.sans,
    fontWeight: '700',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingLeft: 1,
  },
  row: { flexGrow: 0 },
  rowContent: { gap: 7, paddingRight: 4 },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line2,
    backgroundColor: colors.cream,
  },
  pillLabel: {
    fontSize: 10.5,
    fontFamily: fonts.sans,
    fontWeight: '700',
    color: colors.ink2,
  },
});
