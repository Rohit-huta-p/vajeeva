import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export function SectionLabel({ label }: { label: string }) {
  return <Text style={s.t}>{label.toUpperCase()}</Text>;
}

const s = scaledSheet({
  t: {
    fontFamily: fonts.sans, fontSize: 9, fontWeight: '700', letterSpacing: 0.72,
    color: 'rgba(42,37,30,0.28)', marginBottom: 7,
  },
});
