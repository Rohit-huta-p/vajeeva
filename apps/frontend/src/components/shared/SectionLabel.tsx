import React from 'react';
import { Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export function SectionLabel({ label }: { label: string }) {
  const s = useThemedStyles(makeStyles);
  return <Text style={s.t}>{label.toUpperCase()}</Text>;
}

const makeStyles = (colors: Colors) => scaledSheet({
  t: {
    fontFamily: fonts.sans, fontSize: 9, fontWeight: '700', letterSpacing: 0.72,
    color: colors.labelFaint, marginBottom: 7,
  },
});
