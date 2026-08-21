import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';

export function FilterChip({ label, active, onPress, safeForMe }: {
  label: string; active: boolean; onPress: () => void; safeForMe?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.active, safeForMe && s.safeChip]}
      onPress={onPress}
    >
      <Text style={[s.label, active && s.activeLabel, safeForMe && s.safeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    borderWidth: 1, borderColor: colors.line2, marginRight: spacing.sm,
  },
  active: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  safeChip: { borderColor: colors.green },
  label: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  activeLabel: { color: colors.green },
  safeLabel: { color: colors.green },
});
