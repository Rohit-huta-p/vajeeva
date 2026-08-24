import React from 'react';
import { View } from 'react-native';
import { type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export function ContraDots({ count }: { count: number }) {
  const s = useThemedStyles(makeStyles);
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

const makeStyles = (colors: Colors) => scaledSheet({
  row: { flexDirection: 'row', gap: 2.5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.clay, opacity: 0.65 },
});
