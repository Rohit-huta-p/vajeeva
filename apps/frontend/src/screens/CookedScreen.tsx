import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, shadows, type Colors } from '../theme/tokens';
import { useThemedStyles } from '../theme/ThemeContext';
import { useCookLog, madeAgo } from '../hooks/useCookLog';
import type { CookEntry } from '../hooks/useCookLog';
import { getRecipe } from '../offline/catalog';
import { sortImages, cloudThumb } from '../api/recipes';
import { imageSource } from '../offline/images';
import { CategoryIll, categoryTint } from '../components/shared/icons';
import { scaledSheet, sc } from '../theme/scale';

function titleCase(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// The 1/3/5 rating maps back to the finish-screen faces so the journal reads the
// same as where it was captured.
function ratingFace(r?: number): string {
  if (!r) return '';
  if (r <= 2) return '🙁';
  if (r <= 3) return '🙂';
  return '😍';
}

/**
 * "Cooked" — the 4th tab: a chronological journal of every make, with the
 * patient's own dish photos when they added them (docs/specs/2026-09-09-prepared-photos.md §6).
 */
export function CookedScreen() {
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { entries, loading } = useCookLog();

  const makes = [...entries].sort((a, b) => (a.madeAt < b.madeAt ? 1 : -1));

  return (
    <SafeAreaView style={s.root}>
      <View style={s.page}>
        <View style={s.header}><Text style={s.title}>Cooked</Text></View>
        <FlatList
          data={makes}
          keyExtractor={(e, i) => `${e.slug}-${e.madeAt}-${i}`}
          renderItem={({ item }) => (
            <MakeCard entry={item} onPress={() => router.push(`/recipe/${item.slug}` as any)} />
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? null : <Text style={s.empty}>Nothing cooked yet. When you make a recipe, it lands here.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function MakeCard({ entry, onPress }: { entry: CookEntry; onPress: () => void }) {
  const s = useThemedStyles(makeStyles);
  const doc = getRecipe(entry.slug);
  const name = doc?.nameEn ?? titleCase(entry.slug);
  const category = doc?.category ?? 'solid';
  const heroUrl = doc ? sortImages(doc.images)[0]?.url : undefined;
  const photos = entry.photos ?? [];
  const pending = entry.pendingPhotos ?? [];
  const photoCount = photos.length + pending.length;
  const face = ratingFace(entry.rating);

  const thumb =
    photos[0] ? { uri: cloudThumb(photos[0].url, 240, 240) }
    : pending[0] ? { uri: pending[0].localUri }
    : heroUrl ? imageSource(entry.slug, heroUrl, 240, 240)
    : undefined;

  return (
    <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={onPress}>
      <View style={[s.thumbBox, { backgroundColor: categoryTint(category) }]}>
        {thumb
          ? <Image source={thumb} style={s.thumbImg} resizeMode="cover" />
          : <CategoryIll category={category} size={sc(34)} />}
        {photoCount > 1 ? <View style={s.count}><Text style={s.countTxt}>+{photoCount - 1}</Text></View> : null}
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        <Text style={s.meta}>made {madeAgo(entry.madeAt)}{face ? ` · ${face}` : ''}</Text>
        {photoCount === 0 ? <Text style={s.addHint}>Tap to add a photo</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  page: { flex: 1, paddingHorizontal: 14, paddingTop: 8, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', letterSpacing: -0.18, color: colors.ink },
  list: { paddingBottom: 24, gap: 9 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 8,
    ...shadows.card,
  },
  thumbBox: { width: 68, height: 68, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  count: {
    position: 'absolute', right: 4, bottom: 4,
    backgroundColor: 'rgba(20,18,15,0.7)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1,
  },
  countTxt: { color: '#fff', fontSize: 9, fontFamily: fonts.sans, fontWeight: '800' },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontSize: 14, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 11, fontFamily: fonts.sans, color: colors.muted },
  addHint: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.green, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
