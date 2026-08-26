import React from 'react';
import { View } from 'react-native';
import { type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { Shimmer } from './Shimmer';
import { scaledSheet } from '../../theme/scale';

/**
 * Loading placeholder that mirrors RecipeGridCard's exact footprint — 5:4 tile,
 * a 2-line name block, a subtitle line and a meta line — so the grid keeps its
 * height and does not reflow when real cards replace the skeletons.
 */
export function SkeletonCard() {
  const s = useThemedStyles(makeStyles);
  return (
    <Shimmer style={s.card}>
      <View style={s.tile} />
      <View style={s.nameArea}>
        <View style={[s.bar, { width: '90%' }]} />
        <View style={[s.bar, { width: '55%' }]} />
      </View>
      <View style={s.subArea}><View style={[s.bar, { width: '45%' }]} /></View>
      <View style={s.metaArea}><View style={[s.bar, { width: '65%' }]} /></View>
    </Shimmer>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  // Same shape as RecipeGridCard (radius 13, padding 7) but flat + clipped: no
  // shadow (reads as an inert placeholder) and overflow:hidden so the sweep
  // follows the rounded corners.
  card: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 7, overflow: 'hidden',
  },
  tile: { borderRadius: 9, aspectRatio: 5 / 4, backgroundColor: colors.line2 },
  // Heights mirror RecipeGridCard's name (2 lines, 31) / tamil (14) / meta (13).
  nameArea: { marginTop: 7, height: 31, justifyContent: 'space-between' },
  subArea: { marginTop: 1, height: 14, justifyContent: 'center' },
  metaArea: { marginTop: 5, height: 13, justifyContent: 'center' },
  bar: { height: 10, borderRadius: 4, backgroundColor: colors.line2 },
});
