import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from '../../theme/tokens';
import { ContraDots } from './ContraDots';
import type { RecipeListItem } from '../../api/recipes';

export function RecipeCard({ recipe, onPress }: { recipe: RecipeListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      {/* Texture tile */}
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        {recipe.nameTa ? <Text style={s.tamil}>{recipe.nameTa}</Text> : null}
        <Text style={s.meta}>{recipe.category} · {recipe.cookTimeMin}m</Text>
      </View>
      <View style={s.right}>
        {recipe.contraCount > 0 && <ContraDots count={recipe.contraCount} />}
        <Text style={s.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cream, borderRadius: 15,
    padding: spacing.md, marginBottom: 8,
    ...shadows.card,
  },
  tile: {
    width: 50, height: 50, borderRadius: 10,
    backgroundColor: colors.sand, marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 13.5, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  tamil: { fontSize: 10, fontFamily: fonts.serifItalic, color: colors.amber, marginTop: 1 },
  meta: { fontSize: 9, fontFamily: fonts.sans, color: colors.muted, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  chevron: { fontSize: 18, color: colors.muted, opacity: 0.5 },
});
