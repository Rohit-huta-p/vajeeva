import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress}>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  btn: { alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 14, fontFamily: fonts.sans, color: colors.ink2 },
});
