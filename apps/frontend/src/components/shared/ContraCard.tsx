import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function ContraCard({ conditions }: { conditions: string[] }) {
  if (conditions.length === 0) return null;
  return (
    <View style={s.card}>
      <Text style={s.header}>⚠ USE WITH CAUTION</Text>
      <Text style={s.body}>{conditions.join('  ·  ')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(180,71,46,0.07)',
    borderLeftWidth: 3, borderLeftColor: colors.clay,
    borderTopRightRadius: 6, borderBottomRightRadius: 6,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  header: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '800',
    color: colors.clay, letterSpacing: 0.5, marginBottom: 4,
  },
  body: { fontSize: 10, fontFamily: fonts.sans, color: 'rgba(180,71,46,0.84)', lineHeight: 17 },
});
