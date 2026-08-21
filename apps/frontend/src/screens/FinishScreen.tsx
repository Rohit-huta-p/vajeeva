import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { CTA } from '../components/shared/CTA';
import { GhostButton } from '../components/shared/GhostButton';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useCookSession } from '../hooks/useCookSession';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';

// Offline fallback built from the slug, used only if the fetch fails.
function slugFallback(slug: string): RecipeListItem {
  return {
    slug,
    nameEn: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'solid',
    cookTimeMin: 0,
    contraCount: 0,
  };
}

export function FinishScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { save, isSaved } = useSavedRecipes();
  const { clearSession } = useCookSession();
  const [recipe, setRecipe] = useState<RecipeListItem>(() => slugFallback(slug ?? ''));
  const saved = isSaved(slug ?? '');

  useEffect(() => {
    let alive = true;
    if (!slug) return;
    recipesApi.detail(slug)
      .then((doc: RecipeDoc) => { if (alive) setRecipe(toListItem(doc)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  // The cook is finished — drop the active session so HomeScreen stops
  // offering "Continue cooking".
  useEffect(() => { clearSession(); }, [clearSession]);

  return (
    <SafeAreaView style={s.root}>
      {/* Top row */}
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={s.close}>✕</Text>
        </TouchableOpacity>
        <View style={s.fullBar} />
        <Text style={s.done}>Done</Text>
      </View>
      {/* Ring */}
      <View style={s.body}>
        <View style={s.ring}>
          <Text style={s.check}>✓</Text>
        </View>
        <Text style={s.wellMade}>Well made.</Text>
        <Text style={s.sub}>You completed the recipe.</Text>
      </View>
      {/* Save card */}
      <View style={s.saveCard}>
        <Text style={s.saveHeader}>Save for later?</Text>
        <Text style={s.saveSub}>Available offline — no internet needed next time.</Text>
        {!saved ? (
          <CTA label="Save Recipe" onPress={() => save(recipe)} />
        ) : (
          <Text style={s.savedMsg}>✓ Already saved</Text>
        )}
        <GhostButton label="Not now" onPress={() => router.push('/')} />
      </View>
      <Text style={s.shelf}>Shelf life: 4h · refrigerate</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cmBg, padding: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  close: { fontSize: 16, color: colors.cmMuted, marginRight: spacing.md },
  fullBar: { flex: 1, height: 2, backgroundColor: colors.cmGreen, borderRadius: 2 },
  done: { fontSize: 11, fontFamily: fonts.mono, color: colors.cmGreen, marginLeft: spacing.md },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: colors.cmGreen,
    backgroundColor: colors.cmGreenDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  check: { fontSize: 28, color: colors.cmGreen },
  wellMade: { fontSize: 25, fontFamily: fonts.serif, fontWeight: '700', color: colors.cmText, marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: fonts.sans, color: colors.cmMuted },
  saveCard: {
    backgroundColor: colors.cmSurf, borderRadius: 14,
    padding: spacing.lg, gap: 10, marginBottom: spacing.md,
  },
  saveHeader: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.cmGreen },
  saveSub: { fontSize: 12, fontFamily: fonts.sans, color: colors.cmMuted, lineHeight: 17 },
  savedMsg: { fontSize: 13, fontFamily: fonts.sans, color: colors.cmGreen, textAlign: 'center' },
  shelf: { fontSize: 8.5, fontFamily: fonts.mono, color: colors.cmMuted, textAlign: 'center' },
});
