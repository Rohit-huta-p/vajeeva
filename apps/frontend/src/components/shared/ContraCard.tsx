import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';

export function ContraCard({ conditions }: { conditions: string[] }) {
  if (conditions.length === 0) return null;
  return (
    <View style={s.card}>
      <Text style={s.header}>⚠ USE WITH CAUTION</Text>
      {conditions.map(c => (
        <Text key={c} style={s.item}>• {c}</Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(180,71,46,0.07)',
    borderLeftWidth: 3, borderLeftColor: colors.clay,
    borderRadius: 6, padding: spacing.md, marginBottom: 16,
  },
  header: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700',
    color: colors.clay, letterSpacing: 0.06, marginBottom: 6,
  },
  item: { fontSize: 10, fontFamily: fonts.sans, color: `${colors.clay}D6`, marginBottom: 3 },
});
