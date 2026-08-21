import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { SearchBar } from '../components/shared/SearchBar';
import { TexturePillar } from '../components/shared/TexturePillar';
import { SectionLabel } from '../components/shared/SectionLabel';
import { ContinueCookingCard } from '../components/shared/ContinueCookingCard';
import { useCookSession } from '../hooks/useCookSession';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';

const PILLARS = [
  { key: 'solid',      name: 'Solid Foods', subtitle: 'Grains, lentils & vegetables', },
  { key: 'liquid',     name: 'Liquids',      subtitle: 'Broths, rasams & tonics',      },
  { key: 'semi-solid', name: 'Semi-solid',   subtitle: 'Porridges, purees & chutneys', },
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
          <View style={s.logoMark}><Text style={s.logoV}>V</Text></View>
          <Text style={s.greeting}>Good morning · Vajeeva</Text>
          <View style={s.avatar}><Text style={s.avatarInitial}>R</Text></View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>

        {/* Continue cooking */}
        {session && sessionRecipe ? (
          <>
            <SectionLabel label="Continue cooking" />
            <ContinueCookingCard
              recipe={sessionRecipe}
              currentStep={session.stepIndex + 1}
              totalSteps={session.totalSteps}
              onPress={() => router.push(`/cook/${session.slug}` as any)}
            />
          </>
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
            onPress={() => router.push(`/recipe-list?texture=${p.key}` as any)}
          />
        ))}

        {/* Trust badge */}
        <View style={s.trust}>
          <Text style={s.trustText}>🌿 grounded in classical texts · ICMR-NIN 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md,
  },
  logoMark: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoV: { fontSize: 14, fontFamily: fonts.serif, fontWeight: '700', color: colors.green },
  greeting: {
    flex: 1, fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  searchWrap: { marginBottom: spacing.lg },
  heading: {
    fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink,
    marginBottom: spacing.md,
  },
  trust: { marginTop: 20, alignItems: 'center' },
  trustText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
});
