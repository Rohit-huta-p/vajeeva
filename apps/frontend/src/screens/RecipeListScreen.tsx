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
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';

const FILTERS = ['All', 'Solid', 'Liquid', 'Semi-solid'] as const;

// Display label -> API category value; also accepts the texture route param
// (HomeScreen pillar keys: solid | liquid | semi).
const LABEL_TO_CATEGORY: Record<string, string> = {
  Solid: 'solid', Liquid: 'liquid', 'Semi-solid': 'semi-solid',
};
function textureToLabel(texture?: string): string {
  if (!texture) return 'All';
  const t = texture.toLowerCase();
  if (t.startsWith('semi')) return 'Semi-solid';
  const label = t.charAt(0).toUpperCase() + t.slice(1);
  return label in LABEL_TO_CATEGORY ? label : 'All';
}

export function RecipeListScreen() {
  const router = useRouter();
  const { texture } = useLocalSearchParams<{ texture?: string }>();
  const [filter, setFilter] = useState(textureToLabel(texture));
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const docs: RecipeDoc[] = await recipesApi.list(LABEL_TO_CATEGORY[filter]);
      setRecipes(docs.map(toListItem));
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
