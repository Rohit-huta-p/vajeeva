import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

export function ContraDots({ count }: { count: number }) {
  const dots = Math.min(count, 4);
  if (dots === 0) return null;
  return (
    <View style={s.row}>
      {Array.from({ length: dots }).map((_, i) => (
        <View key={i} style={s.dot} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2.5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.clay, opacity: 0.65 },
});
