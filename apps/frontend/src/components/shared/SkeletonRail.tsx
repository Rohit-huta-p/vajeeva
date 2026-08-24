import React from 'react';
import { View, ScrollView } from 'react-native';
import { type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { Shimmer } from './Shimmer';
import { scaledSheet } from '../../theme/scale';

/**
 * Loading placeholder for Home's "Jump back in" rail — a horizontal strip of
 * image-tile cards matching PickUpRail's recently-viewed cards (90×80 tile +
 * a meta line), so the rail doesn't pop in.
 */
export function SkeletonRail({ count = 4 }: { count?: number }) {
  const s = useThemedStyles(makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.rail}
      contentContainerStyle={s.content}
      scrollEnabled={false}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={s.item}>
          <Shimmer style={s.tile} />
          <View style={s.meta} />
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  rail: { flexGrow: 0, marginHorizontal: -14 },
  content: { gap: 9, paddingHorizontal: 14, paddingBottom: 2, alignItems: 'flex-start' },
  item: { width: 90 },
  // Matches PickUpRail's recent card: 90×80 rounded tile + a meta line.
  tile: { width: 90, height: 80, borderRadius: 13, overflow: 'hidden', backgroundColor: colors.line2 },
  meta: { width: '70%', height: 8, borderRadius: 4, marginTop: 6, backgroundColor: colors.line2 },
});
