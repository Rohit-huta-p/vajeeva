import React from 'react';
import { View, Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconLeaf } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

export function OfflineBadge() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.pill}>
      <IconLeaf size={sc(11)} color={colors.green} />
      <Text style={s.label}>Offline</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.sand, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  label: { fontSize: 9.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
});
