import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme';

export type Recipe = {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: string;
  yieldStr?: string;
  shelfLife?: string;
};

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export default function RecipeCard({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      <View style={s.top}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        {recipe.nameTa ? <Text style={s.ta}>{recipe.nameTa}</Text> : null}
      </View>
      <View style={s.foot}>
        <Text style={s.badge}>{recipe.category}</Text>
        <Text style={s.meta}>{recipe.yieldStr} · {recipe.shelfLife}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:  { backgroundColor: colors.sand, borderRadius: 14, padding: 16, marginBottom: 10,
           shadowColor: colors.ink, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  top:   { marginBottom: 10, gap: 2 },
  name:  { fontSize: 17, fontWeight: '700', color: colors.ink },
  ta:    { fontSize: 12, fontStyle: 'italic', color: colors.amber },
  foot:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { fontSize: 11, color: colors.ink2, backgroundColor: colors.line,
           paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4 },
  meta:  { fontSize: 11, color: colors.muted },
});
