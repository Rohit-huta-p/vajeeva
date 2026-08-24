import React from 'react';
import { Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export function Disclaimer({ text }: { text: string }) {
  const s = useThemedStyles(makeStyles);
  return <Text style={s.t}>{text}</Text>;
}

const makeStyles = (colors: Colors) => scaledSheet({
  t: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', lineHeight: 13 },
});
