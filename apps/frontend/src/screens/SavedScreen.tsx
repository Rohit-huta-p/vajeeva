import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { OfflineBadge } from '../components/shared/OfflineBadge';
import { RecipeCard } from '../components/shared/RecipeCard';
import { useSavedRecipes } from '../hooks/useSavedRecipes';

export function SavedScreen() {
  const router = useRouter();
  const { recipes, loading } = useSavedRecipes();

  return (
    <SafeAreaView style={s.root}>
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
          renderItem={({ item }) => (
            <View style={s.col}>
              <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.slug}` as any)} />
            </View>
          )}
          contentContainerStyle={s.grid}
          ListEmptyComponent={
            <Text style={s.empty}>No saved recipes yet.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  loading: { marginTop: 60 },
  grid: { padding: spacing.md },
  col: { flex: 1, margin: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
