import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function SourcePill({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.pill} onPress={onPress}>
      <Text style={s.label}>{name}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    borderWidth: 1, borderColor: colors.amber, borderStyle: 'dashed',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
  },
  label: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.amber },
});
