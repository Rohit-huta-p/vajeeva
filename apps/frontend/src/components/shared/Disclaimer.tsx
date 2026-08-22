import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export function Disclaimer({ text }: { text: string }) {
  return <Text style={s.t}>{text}</Text>;
}

const s = scaledSheet({
  t: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', lineHeight: 13 },
});
