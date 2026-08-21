import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function SectionLabel({ label }: { label: string }) {
  return <Text style={s.t}>{label.toUpperCase()}</Text>;
}

const s = StyleSheet.create({
  t: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.1,
    color: colors.ink, opacity: 0.28, marginBottom: 6,
  },
});
