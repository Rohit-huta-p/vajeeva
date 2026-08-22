import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { ContraDots } from './ContraDots';
import { IconChev, CategoryIll, categoryTint } from './icons';
import type { RecipeListItem } from '../../api/recipes';
import { scaledSheet, sc } from '../../theme/scale';

function metaLabel(r: RecipeListItem) {
  const cat = r.category.charAt(0).toUpperCase() + r.category.slice(1);
  return r.cookTimeMin > 0 ? `${cat} · ~${r.cookTimeMin} min` : cat;
}

export function RecipeCard({ recipe, onPress }: { recipe: RecipeListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={[s.tile, { backgroundColor: categoryTint(recipe.category) }]}>
        <CategoryIll category={recipe.category} size={sc(42)} />
      </View>
      <View style={s.info}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        {recipe.nameTa ? <Text style={s.tamil} numberOfLines={1}>{recipe.nameTa}</Text> : null}
        <Text style={s.meta}>{metaLabel(recipe)}</Text>
      </View>
      <IconChev size={sc(18)} color={colors.muted} />
      {recipe.contraCount > 0 && (
        <View style={s.cdots}>
          <ContraDots count={recipe.contraCount} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cream, borderRadius: 15,
    borderWidth: 1, borderColor: colors.line,
    paddingVertical: 8, paddingHorizontal: 10,
    ...shadows.card,
  },
  tile: {
    width: 50, height: 50, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13.5, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, lineHeight: 15.5 },
  tamil: { fontSize: 10, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 1 },
  meta: { fontSize: 9, fontFamily: fonts.sans, color: colors.muted, marginTop: 3 },
  cdots: { position: 'absolute', top: 9, right: 38 },
});
