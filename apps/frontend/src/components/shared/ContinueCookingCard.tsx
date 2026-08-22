import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { IconPlay, CategoryIll } from './icons';
import type { RecipeListItem } from '../../api/recipes';
import { scaledSheet, sc } from '../../theme/scale';

export function ContinueCookingCard({ recipe, currentStep, totalSteps, onPress }: {
  recipe: RecipeListItem; currentStep: number; totalSteps: number; onPress: () => void;
}) {
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
  const fillWidth: DimensionValue = `${Math.round(progress * 100)}%`;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.tile}><CategoryIll category={recipe.category} size={sc(30)} /></View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>Continue · {recipe.nameEn}</Text>
        <Text style={s.step}>Step {currentStep} of {totalSteps}</Text>
        <View style={s.track}>
          <View style={[s.fill, { width: fillWidth }]} />
        </View>
      </View>
      <View style={s.play}><IconPlay size={sc(12)} color={colors.green} /></View>
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.green, borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 12,
    ...shadows.card,
  },
  tile: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
  step: { fontSize: 10, fontFamily: fonts.sans, color: colors.onGreen, opacity: 0.85 },
  track: {
    height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 5, overflow: 'hidden',
  },
  fill: { height: 3, backgroundColor: colors.onGreen },
  play: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.onGreen, alignItems: 'center', justifyContent: 'center',
  },
});
