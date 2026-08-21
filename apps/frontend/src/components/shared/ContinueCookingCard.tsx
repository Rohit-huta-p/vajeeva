import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, DimensionValue } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';
import type { RecipeListItem } from '../../api/recipes';

export function ContinueCookingCard({ recipe, currentStep, totalSteps, onPress }: {
  recipe: RecipeListItem; currentStep: number; totalSteps: number; onPress: () => void;
}) {
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
  const fillWidth: DimensionValue = `${Math.round(progress * 100)}%`;
  return (
    <View style={s.card}>
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        <Text style={s.step}>Step {currentStep} of {totalSteps}</Text>
        <View style={s.track}>
          <View style={[s.fill, { width: fillWidth }]} />
        </View>
      </View>
      <TouchableOpacity style={s.play} onPress={onPress}>
        <Text style={s.playIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.green, borderRadius: 14,
    padding: spacing.md, marginBottom: 16,
  },
  tile: { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.greenPress, marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: fonts.serif, fontWeight: '700', color: colors.onGreen },
  step: { fontSize: 10, fontFamily: fonts.sans, color: colors.onGreen, opacity: 0.8, marginTop: 2 },
  track: { height: 3, backgroundColor: 'rgba(251,248,241,0.25)', borderRadius: 2, marginTop: 6 },
  fill: { height: 3, backgroundColor: colors.onGreen, borderRadius: 2 },
  play: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.onGreen, alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 10, color: colors.green, marginLeft: 2 },
});
