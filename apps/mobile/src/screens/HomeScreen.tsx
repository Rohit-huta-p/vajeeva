import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import RecipeCard from '../components/RecipeCard';
import CategoryFilter, { Category } from '../components/CategoryFilter';
import type { Recipe } from '../components/RecipeCard';
import type { HomeScreenProps } from '../navigation/types';
import { colors } from '../theme';
import { recipesApi } from '../api';

function HomeInner({ recipes, navigation, refreshing, onRefresh }: {
  recipes: Recipe[]; navigation: HomeScreenProps['navigation'];
  refreshing: boolean; onRefresh: () => void;
}) {
  return (
    <FlatList
      data={recipes}
      keyExtractor={r => r.slug}
      renderItem={({ item }) => (
        <RecipeCard recipe={item} onPress={() => navigation.navigate('RecipeDetail', { slug: item.slug })} />
      )}
      ListEmptyComponent={<Text style={s.empty}>No recipes yet.</Text>}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
    />
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [category, setCategory] = useState<Category>('all');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await recipesApi.list();
      const filtered = all.filter((r: any) => {
        if (r.status !== 'published') return false;
        if (category !== 'all' && r.category !== category) return false;
        return true;
      });
      setRecipes(filtered);
    } catch (e) {
      console.warn('Failed to load recipes', e);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={s.root}>
      <Text style={s.heading}>Vajeeva</Text>
      <CategoryFilter selected={category} onSelect={setCategory} />
      <HomeInner recipes={recipes} navigation={navigation} refreshing={refreshing} onRefresh={onRefresh} />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bone },
  heading: { fontSize: 22, fontWeight: '800', color: colors.ink, padding: 16, paddingBottom: 0 },
  list:    { padding: 16, paddingTop: 6 },
  empty:   { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
