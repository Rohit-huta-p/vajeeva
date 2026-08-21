import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function Disclaimer({ text }: { text: string }) {
  return <Text style={s.t}>{text}</Text>;
}

const s = StyleSheet.create({
  t: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', lineHeight: 13 },
});
