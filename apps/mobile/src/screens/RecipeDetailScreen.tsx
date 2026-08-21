import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { RecipeDetailProps } from '../navigation/types';
import type { Recipe } from '../components/RecipeCard';
import IngredientTable from '../components/IngredientTable';
import HealthFlagList from '../components/HealthFlagList';
import SourceList from '../components/SourceList';
import SaveButton from '../components/SaveButton';
import { colors } from '../theme';
import { recipesApi } from '../api';

export default function RecipeDetailScreen({ route, navigation }: RecipeDetailProps) {
  const { slug } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await recipesApi.detail(slug);
        if (mounted) setRecipe(data);
      } catch (e) {
        console.warn('Failed to load recipe', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  if (!recipe) return <ActivityIndicator style={{ flex: 1 }} color={colors.green} />;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.title}>{recipe.nameEn}</Text>
      {recipe.nameTa ? <Text style={s.titleTa}>{recipe.nameTa}</Text> : null}
      <Text style={s.desc}>{recipe.description}</Text>

      <View style={s.metaRow}>
        <Text style={s.metaItem}>Yield: {recipe.yieldStr}</Text>
        <Text style={s.metaItem}>Shelf: {recipe.shelfLife}</Text>
      </View>

      <View style={s.actions}>
        <SaveButton isSaved={false} onPress={() => {}} />
        <TouchableOpacity style={s.cookBtn}
          onPress={() => navigation.navigate('CookMode', { slug })}>
          <Text style={s.cookBtnText}>▶ Cook Mode</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionHead}>Ingredients</Text>
      <IngredientTable ingredients={recipe.ingredients} />

      <Text style={s.sectionHead}>Health Flags</Text>
      <HealthFlagList flags={recipe.healthFlags} />

      <Text style={s.sectionHead}>Sources</Text>
      <SourceList sources={recipe.sources} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bone },
  content:     { padding: 20, gap: 16, paddingBottom: 40 },
  back:        { marginBottom: 4 },
  backText:    { color: colors.green, fontSize: 14, fontWeight: '600' },
  title:       { fontSize: 26, fontWeight: '800', color: colors.ink },
  titleTa:     { fontSize: 14, fontStyle: 'italic', color: colors.amber },
  desc:        { fontSize: 14, color: colors.ink2, lineHeight: 21 },
  metaRow:     { flexDirection: 'row', gap: 16 },
  metaItem:    { fontSize: 12, color: colors.muted },
  actions:     { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cookBtn:     { flex: 1, backgroundColor: colors.green, borderRadius: 14,
                 padding: 14, alignItems: 'center' },
  cookBtnText: { color: colors.cream, fontWeight: '800', fontSize: 15 },
  sectionHead: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 4 },
});
