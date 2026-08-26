import React from 'react';
import { View } from 'react-native';
import { type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { Shimmer } from './Shimmer';
import { scaledSheet } from '../../theme/scale';

/**
 * Loading placeholder for the Saved grid — mirrors SavedScreen's card (72pt
 * image rim + name + subtitle + meta) so the grid does not reflow when the
 * saved recipes load in.
 */
export function SkeletonSavedCard() {
  const s = useThemedStyles(makeStyles);
  return (
    <Shimmer style={s.card}>
      <View style={s.rim} />
      <View style={[s.bar, s.name, { width: '80%' }]} />
      <View style={[s.bar, s.skt, { width: '50%' }]} />
      <View style={[s.bar, s.meta, { width: '60%' }]} />
    </Shimmer>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  card: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 7, overflow: 'hidden',
  },
  rim: { height: 72, borderRadius: 9, backgroundColor: colors.line2 },
  bar: { height: 9, borderRadius: 4, backgroundColor: colors.line2 },
  // Match SavedCard's name (mt6) / skt (mt2) / meta (mt5) rhythm.
  name: { height: 10, marginTop: 6 },
  skt: { marginTop: 3 },
  meta: { marginTop: 5 },
});
