import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { Recipe } from '../components/RecipeCard';
import { colors } from '../theme';
import { recipesApi } from '../api';
import { useSavedRecipe } from '../hooks/useSavedRecipes';
// ponytail: renders all, each item hides itself if not saved; fine for 83 recipes

function SavedItem({ recipe }: { recipe: Recipe }) {
  const { isSaved } = useSavedRecipe(recipe.slug);
  if (!isSaved) return null;
  return <Text style={styles.item}>{recipe.nameEn}</Text>;
}

export default function SavedScreen() {
  const [all, setAll] = useState<Recipe[]>([]);

  useEffect(() => {
    let mounted = true;
    recipesApi.list()
      .then(data => { if (mounted) setAll(data.filter((r: any) => r.status === 'published')); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Saved</Text>
      <FlatList
        data={all}
        keyExtractor={r => r.slug}
        renderItem={({ item }) => <SavedItem recipe={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No saved recipes yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bone, padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  empty:   { textAlign: 'center', color: colors.muted, marginTop: 40 },
  item:    { padding: 12, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.line },
});
