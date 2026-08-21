import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, ScrollView, Text, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { RecipeCard } from '../components/shared/RecipeCard';
import { FilterChip } from '../components/shared/FilterChip';
import { IconButton } from '../components/shared/IconButton';
import { recipesApi } from '../api/recipes';
import type { RecipeListItem } from '../api/recipes';

const FILTERS = ['All', 'Solid', 'Liquid', 'Semi-solid'];

export function RecipeListScreen() {
  const router = useRouter();
  const { texture } = useLocalSearchParams<{ texture?: string }>();
  const [filter, setFilter] = useState(texture ?? 'All');
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all: RecipeListItem[] = await recipesApi.list();
      setRecipes(filter === 'All' ? all : all.filter(r => r.category.toLowerCase() === filter.toLowerCase()));
    } catch {}
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <IconButton icon="←" onPress={() => router.back()} />
        <Text style={s.title}>{filter === 'All' ? 'All Recipes' : filter}</Text>
        <Text style={s.count}>{recipes.length} recipes</Text>
      </View>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
        {FILTERS.map(f => (
          <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
        <FilterChip label="🛡 Safe for me" active={false} onPress={() => {}} safeForMe />
      </ScrollView>
      {/* List */}
      <FlatList
        data={recipes}
        keyExtractor={r => r.slug}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.slug}`)} />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  count: { fontSize: 11, fontFamily: fonts.sans, color: colors.muted },
  chips: { paddingLeft: spacing.lg, marginBottom: spacing.sm, flexGrow: 0 },
  chipsContent: { paddingRight: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
});
