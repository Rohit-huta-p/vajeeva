import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, ScrollView, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { RecipeCard } from '../components/shared/RecipeCard';
import { FilterChip } from '../components/shared/FilterChip';
import { IconBack, IconFilter } from '../components/shared/icons';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';

const FILTERS = ['All', 'Solid', 'Liquid', 'Semi-solid'] as const;

// Display label -> API category value; also accepts the texture route param
// (HomeScreen pillar keys: solid | liquid | semi).
const LABEL_TO_CATEGORY: Record<string, string> = {
  Solid: 'solid', Liquid: 'liquid', 'Semi-solid': 'semi-solid',
};
// Per-category subtitle copy, mirroring the Home pillar subs (fidelity spec).
const LABEL_SUB: Record<string, string> = {
  Solid: 'breads · sweets · snacks',
  Liquid: 'drinks · soups · buttermilk',
  'Semi-solid': 'porridge · puddings · chutneys',
};
function textureToLabel(texture?: string): string {
  if (!texture) return 'All';
  const t = texture.toLowerCase();
  if (t.startsWith('semi')) return 'Semi-solid';
  const label = t.charAt(0).toUpperCase() + t.slice(1);
  return label in LABEL_TO_CATEGORY ? label : 'All';
}

// Round icon button per prototype .icobtn (IconButton atom is mid-refit by Pam).
function IcoBtn({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.icobtn} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
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
    } catch { }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const sub = LABEL_SUB[filter]
    ? `${recipes.length} recipes · ${LABEL_SUB[filter]}`
    : `${recipes.length} recipes`;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <IcoBtn onPress={() => router.back()}>
            <IconBack size={15} color={colors.ink} />
          </IcoBtn>
          <View style={s.grow}>
            <Text style={s.title}>{filter === 'All' ? 'All Recipes' : filter}</Text>
            <Text style={s.subtitle}>{sub}</Text>
          </View>
          <IcoBtn>
            <IconFilter size={15} color={colors.ink} />
          </IcoBtn>
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
          {FILTERS.map(f => (
            <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
          <FilterChip label="🛡 Safe for me" active={false} onPress={() => { }} safeForMe />
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
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 6, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', letterSpacing: -0.18, color: colors.ink },
  subtitle: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2 },
  icobtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  chips: { flexGrow: 0 },
  chipsContent: { gap: 6, paddingBottom: 2 },
  list: { gap: 10, paddingBottom: 40 },
});
