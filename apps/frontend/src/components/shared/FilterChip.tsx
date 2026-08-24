import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { IconCheck } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

export function FilterChip({ label, active, onPress, safeForMe, icon }: {
  label: string; active: boolean; onPress: () => void; safeForMe?: boolean;
  /** optional leading icon (e.g. Home mood chips); the active check takes its place */
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.active, safeForMe && s.safeChip]}
      onPress={onPress}
    >
      {active ? <IconCheck size={sc(11)} color={colors.green} /> : (icon ?? null)}
      <Text style={[s.label, active && s.activeLabel, safeForMe && s.safeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1.5, borderColor: colors.line2, backgroundColor: colors.cream,
  },
  active: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  safeChip: { borderColor: colors.green },
  label: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  activeLabel: { color: colors.green },
  safeLabel: { color: colors.green },
});
