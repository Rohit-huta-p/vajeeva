import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { OfflineBadge } from '../components/shared/OfflineBadge';
import { CategoryIll, categoryTint } from '../components/shared/icons';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import type { RecipeListItem } from '../api/recipes';
import { scaledSheet, sc } from '../theme/scale';

// Prototype .rcard — compact 2-col grid card.
function SavedCard({ recipe, onPress }: { recipe: RecipeListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={[s.rim, { backgroundColor: categoryTint(recipe.category) }]}>
        <CategoryIll category={recipe.category} size={sc(60)} />
      </View>
      <Text style={s.name} numberOfLines={1}>{recipe.nameEn}</Text>
      {recipe.nameTa ? <Text style={s.skt} numberOfLines={1}>{recipe.nameTa}</Text> : null}
      <Text style={s.meta}>
        {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
        {recipe.cookTimeMin > 0 ? ` · ${recipe.cookTimeMin} min` : ''}
      </Text>
    </TouchableOpacity>
  );
}

export function SavedScreen() {
  const router = useRouter();
  const { recipes, loading } = useSavedRecipes();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Saved</Text>
          <OfflineBadge />
        </View>
        {loading ? (
          <ActivityIndicator style={s.loading} color={colors.green} />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={r => r.slug}
            numColumns={2}
            columnWrapperStyle={s.gridRow}
            renderItem={({ item }) => (
              <View style={s.col}>
                <SavedCard recipe={item} onPress={() => router.push(`/recipe/${item.slug}` as any)} />
              </View>
            )}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={s.empty}>No saved recipes yet.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 8, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', letterSpacing: -0.18, color: colors.ink },
  loading: { marginTop: 60 },
  grid: { paddingBottom: 24, gap: 9 },
  gridRow: { gap: 9 },
  // maxWidth keeps a lone card in the last row at column width instead of
  // stretching across both columns (spec: 2-col grid).
  col: { flex: 1, maxWidth: '50%' },
  card: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 7,
    ...shadows.card,
  },
  rim: {
    height: 72, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 12, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginTop: 6, lineHeight: 14 },
  skt: { fontSize: 9, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber },
  meta: { fontSize: 9, fontFamily: fonts.sans, color: colors.muted, marginTop: 5 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
