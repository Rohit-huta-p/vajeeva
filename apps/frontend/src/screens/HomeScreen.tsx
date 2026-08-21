import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { SearchBar } from '../components/shared/SearchBar';
import { TexturePillar } from '../components/shared/TexturePillar';
import { ContinueCookingCard } from '../components/shared/ContinueCookingCard';
import { MkSprout, IconUser, IconLeaf } from '../components/shared/icons';
import { useCookSession } from '../hooks/useCookSession';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';

const PILLARS = [
  { key: 'solid',      name: 'Solid',      subtitle: 'Breads · sweets · snacks' },
  { key: 'liquid',     name: 'Liquid',     subtitle: 'Drinks · soups · buttermilk' },
  { key: 'semi-solid', name: 'Semi-solid', subtitle: 'Porridge · puddings · chutneys' },
] as const;

export function HomeScreen() {
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessionRecipe, setSessionRecipe] = useState<RecipeListItem | null>(null);
  const router = useRouter();
  const { session } = useCookSession();

  useEffect(() => {
    let alive = true;
    recipesApi.list().then((docs: RecipeDoc[]) => {
      if (!alive) return;
      const next: Record<string, number> = {};
      docs.forEach(d => { next[d.category] = (next[d.category] ?? 0) + 1; });
      setCounts(next);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Resolve the in-progress recipe for the ContinueCookingCard; the session
  // itself is the offline fallback if the fetch fails.
  useEffect(() => {
    let alive = true;
    if (!session) { setSessionRecipe(null); return; }
    const fallback: RecipeListItem = {
      slug: session.slug, nameEn: session.title, category: session.texture,
      cookTimeMin: 0, contraCount: 0,
    };
    setSessionRecipe(fallback);
    recipesApi.detail(session.slug)
      .then((doc: RecipeDoc) => { if (alive) setSessionRecipe(toListItem(doc)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [session?.slug]);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo row */}
        <View style={s.logoRow}>
          <View style={s.logoMark}><MkSprout size={18} /></View>
          <View style={s.grow}>
            <Text style={s.greeting}>Good morning</Text>
            <Text style={s.greetingSub}>Vajeeva</Text>
          </View>
          <View style={s.avatar}><IconUser size={15} color={colors.green} /></View>
        </View>

        {/* Search */}
        <SearchBar value={search} onChangeText={setSearch} />

        {/* Continue cooking */}
        {session && sessionRecipe ? (
          <ContinueCookingCard
            recipe={sessionRecipe}
            currentStep={session.stepIndex + 1}
            totalSteps={session.totalSteps}
            onPress={() => router.push(`/cook/${session.slug}` as any)}
          />
        ) : null}

        {/* Section heading */}
        <Text style={s.heading}>What would you like today?</Text>

        {/* Texture pillars */}
        {PILLARS.map(p => (
          <TexturePillar
            key={p.key}
            name={p.name}
            subtitle={p.subtitle}
            count={counts[p.key] ?? 0}
            category={p.key}
            onPress={() => router.push(`/recipe-list?texture=${p.key}` as any)}
          />
        ))}

        {/* Trust badge */}
        <View style={s.trust}>
          <IconLeaf size={11} color={colors.green} />
          <Text style={s.trustText}>grounded in classical texts + ICMR-NIN 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  scroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 10 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  grow: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  greetingSub: { fontSize: 10, fontFamily: fonts.sans, fontWeight: '600', color: colors.ink2 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  heading: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  trust: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8,
  },
  trustText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
});
