import React from 'react';
import { View, Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconBookmark } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * Empty-state for "Your kitchen": nothing saved yet, so teach the one gesture
 * (the bookmark) and reassure that saved recipes stay offline for the kitchen.
 */
export function SaveNudge() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.card}>
      <View style={s.ic}><IconBookmark size={sc(17)} color={colors.ink2} /></View>
      <Text style={s.text}>Tap the bookmark on any recipe to keep it here — your saved recipes work fully offline.</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.cream, borderRadius: 14,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line2,
    padding: 12,
  },
  ic: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 10, lineHeight: 14, color: colors.ink2 },
});
