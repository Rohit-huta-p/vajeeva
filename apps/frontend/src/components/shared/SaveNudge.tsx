import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { IconHeart } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * Empty-state for "Your kitchen": nothing saved yet, so teach the one gesture
 * (the heart) and reassure that saved recipes stay offline for the kitchen.
 */
export function SaveNudge() {
  return (
    <View style={s.card}>
      <View style={s.ic}><IconHeart size={sc(17)} color={colors.clay} /></View>
      <Text style={s.text}>Tap the heart on any recipe to keep it here — your saved recipes work fully offline.</Text>
    </View>
  );
}

const s = scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: colors.cream, borderRadius: 14,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line2,
    padding: 12,
  },
  ic: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.claySoft, alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 10, lineHeight: 14, color: colors.ink2 },
});
