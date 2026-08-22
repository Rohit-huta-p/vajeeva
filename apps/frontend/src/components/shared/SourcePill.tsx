import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export function SourcePill({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.pill} onPress={onPress}>
      <Text style={s.label}>{name} <Text style={s.ext}>↗</Text></Text>
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  pill: {
    borderWidth: 1, borderColor: 'rgba(198,144,47,0.42)',
    borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3,
  },
  label: { fontSize: 10, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber },
  ext: { fontSize: 8, opacity: 0.6, fontStyle: 'normal', fontFamily: fonts.sans },
});
