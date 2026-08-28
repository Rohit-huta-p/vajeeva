import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, shadows, type Colors } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';
import { OfflineBadge } from '../components/shared/OfflineBadge';
import { SkeletonSavedCard } from '../components/shared/SkeletonSavedCard';
import { CategoryIll, categoryTint } from '../components/shared/icons';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { imageSource } from '../offline/images';
import { scaledSheet, sc } from '../theme/scale';

// Placeholder cells shown while saved recipes load from on-device storage.
const SAVED_SKELETONS = [0, 1, 2, 3, 4, 5];

export function SavedScreen() {
  const s = useThemedStyles(makeStyles);
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
          <FlatList
            data={SAVED_SKELETONS}
            keyExtractor={i => `skel-${i}`}
            numColumns={2}
            columnWrapperStyle={s.gridRow}
            renderItem={() => <View style={s.col}><SkeletonSavedCard /></View>}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={recipes}
            keyExtractor={r => r.slug}
            numColumns={2}
            columnWrapperStyle={s.gridRow}
            renderItem={({ item }) => (
              <View style={s.col}>
                {/* Prototype .rcard — compact 2-col grid card. */}
                <TouchableOpacity
                  style={s.card}
                  onPress={() => router.push(`/recipe/${item.slug}` as any)}
                  activeOpacity={0.92}
                >
                  <View style={[s.rim, { backgroundColor: categoryTint(item.category) }]}>
                    {item.imageUrl ? (
                      <Image
                        source={imageSource(item.slug, item.imageUrl, 500, 220)}
                        accessibilityLabel={item.nameEn}
                        style={s.rimImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <CategoryIll category={item.category} size={sc(60)} />
                    )}
                  </View>
                  <Text style={s.name} numberOfLines={1}>{item.nameEn}</Text>
                  {item.nameTa ? <Text style={s.skt} numberOfLines={1}>{item.nameTa}</Text> : null}
                  <Text style={s.meta}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    {item.cookTimeMin > 0 ? ` · ${item.cookTimeMin} min` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={s.empty}>No saved recipes yet.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 8, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', letterSpacing: -0.18, color: colors.ink },
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
    overflow: 'hidden',
  },
  rimImg: { width: '100%', height: '100%' },
  name: { fontSize: 12, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginTop: 6, lineHeight: 14 },
  skt: { fontSize: 9, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber },
  meta: { fontSize: 9, fontFamily: fonts.sans, color: colors.muted, marginTop: 5 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
