import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { SearchBar } from '../components/shared/SearchBar';
import { TexturePillar } from '../components/shared/TexturePillar';
import { PickUpRail } from '../components/shared/PickUpRail';
import { RecipeGridCard } from '../components/shared/RecipeGridCard';
import { FilterChip } from '../components/shared/FilterChip';
import { WelcomeCard } from '../components/shared/WelcomeCard';
import { SaveNudge } from '../components/shared/SaveNudge';
import {
  MkSprout, IconUser, IconLeaf, IconChev, IconClock, IconDrop,
} from '../components/shared/icons';
import { useCookSession } from '../hooks/useCookSession';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';
import { FACETS } from '../config/facets';
import { scaledSheet, sc } from '../theme/scale';

const PILLARS = [
  { key: 'solid',      name: 'Solid',      subtitle: 'Breads · sweets · snacks' },
  { key: 'liquid',     name: 'Liquid',     subtitle: 'Drinks · soups · buttermilk' },
  { key: 'semi-solid', name: 'Semi-solid', subtitle: 'Porridge · puddings · chutneys' },
] as const;

// Mood-chip leading icon, resolved from the facet's icon id (facets.ts stays JSX-free).
function facetIcon(icon: string) {
  if (icon === 'clock') return <IconClock size={sc(12)} color={colors.amber2} />;
  if (icon === 'drop')  return <IconDrop size={sc(12)} color={colors.green} />;
  return <IconLeaf size={sc(12)} color={colors.green} />; // 'leaf' → No-cook
}

/**
 * Home is a calm four-zone funnel — resume → find → browse → your kitchen. The
 * greeting + search pin to the bone header; the zones drop into a sand "well"
 * with a rounded lip (mirrors RecipeListScreen), so the fixed chrome reads apart
 * from the scrolling content. Zones needing on-device history gracefully become
 * guidance for a brand-new patient (WelcomeCard / SaveNudge).
 */
export function HomeScreen() {
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessionRecipe, setSessionRecipe] = useState<RecipeListItem | null>(null);
  const router = useRouter();
  const { session, reload: reloadSession } = useCookSession();
  const { recipes: saved, unsave, reload: reloadSaved } = useSavedRecipes();
  const { recipes: recent, reload: reloadRecent } = useRecentlyViewed();

  // Texture-pulse cue: "Choose a texture" scrolls the doors into view and pulses
  // each one (staggered green ring) so a new patient's eye lands on the choice.
  const scrollRef = useRef<ScrollView>(null);
  const texY = useRef(0);
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const pulseTextures = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, texY.current - sc(12)), animated: true });
    const onePulse = (v: Animated.Value) => Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    Animated.stagger(110, rings.map(v => Animated.sequence([onePulse(v), onePulse(v)]))).start();
  }, [rings]);

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

  // Resolve the in-progress recipe for the pick-up rail's cook lead; the session
  // itself is the offline fallback if the fetch fails.
  useEffect(() => {
    let alive = true;
    if (!session) { setSessionRecipe(null); return; }
    const fallback: RecipeListItem = {
      slug: session.slug, nameEn: session.title, category: session.texture,
      cookTimeMin: 0, contraCount: 0, fit: null, stepCount: 0,
    };
    setSessionRecipe(fallback);
    recipesApi.detail(session.slug)
      .then((doc: RecipeDoc) => { if (alive) setSessionRecipe(toListItem(doc)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [session?.slug]);

  // Home is a persistent tab — re-pull on-device state whenever it regains
  // focus, so "Jump back in" / "Your kitchen" reflect what you just did
  // (viewed a recipe, saved one, made cook progress).
  useFocusEffect(
    useCallback(() => {
      reloadSession();
      reloadSaved();
      reloadRecent();
    }, [reloadSession, reloadSaved, reloadRecent]),
  );

  const hasHistory = !!session || recent.length > 0;

  return (
    <View style={s.root}>
      {/* Pinned header — greeting + search stay on bone above the tray */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoMark}><MkSprout size={sc(18)} /></View>
          <View style={s.grow}>
            <Text style={s.greeting}>Good morning</Text>
            <Text style={s.greetingSub}>Vajeeva</Text>
          </View>
          <View style={s.avatar}><IconUser size={sc(15)} color={colors.green} /></View>
        </View>
        <SearchBar
          placeholder="Try coconut · a quick sweet · buttermilk"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content well — sand tray with a rounded lip (mirrors RecipeListScreen) */}
      <View style={s.well}>
        <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Zone 1 · Jump back in — or a welcome for a brand-new patient */}
          {hasHistory ? (
            <>
              <Text style={s.zone}>Jump back in</Text>
              <PickUpRail
                cook={session && sessionRecipe
                  ? { recipe: sessionRecipe, currentStep: session.stepIndex + 1, totalSteps: session.totalSteps }
                  : null}
                recent={recent}
                onResume={() => session && router.push(`/cook/${session.slug}` as any)}
                onOpenRecent={slug => router.push(`/recipe/${slug}` as any)}
              />
            </>
          ) : (
            <WelcomeCard onChooseTexture={pulseTextures} />
          )}

          {/* Zone 2 · Find something to cook — derived mood facets */}
          <Text style={s.zone}>Find something to cook</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsRow}
            contentContainerStyle={s.chipsContent}
          >
            {FACETS.map(f => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={false}
                icon={facetIcon(f.icon)}
                onPress={() => router.push(`/recipe-list?facet=${f.key}` as any)}
              />
            ))}
          </ScrollView>

          {/* Zone 3 · Browse by texture — the kept spine (pulse target) */}
          <Text
            style={s.zone}
            onLayout={e => { texY.current = e.nativeEvent.layout.y; }}
          >
            Browse by texture
          </Text>
          {PILLARS.map((p, i) => (
            <View key={p.key} style={s.pillarWrap}>
              <TexturePillar
                name={p.name}
                subtitle={p.subtitle}
                count={counts[p.key] ?? 0}
                category={p.key}
                onPress={() => router.push(`/recipe-list?texture=${p.key}` as any)}
              />
              <Animated.View pointerEvents="none" style={[s.ring, { opacity: rings[i] }]} />
            </View>
          ))}

          {/* Zone 4 · Your kitchen — saved recipes, or a nudge to start saving */}
          <View style={s.zoneRow}>
            <Text style={s.zone}>Your kitchen</Text>
            {saved.length > 0 ? (
              <TouchableOpacity style={s.seeAll} onPress={() => router.push('/saved' as any)}>
                <Text style={s.seeAllText}>See all</Text>
                <IconChev size={sc(11)} color={colors.green} />
              </TouchableOpacity>
            ) : null}
          </View>
          {saved.length > 0 ? (
            <View style={s.savedGrid}>
              {saved.slice(0, 2).map(r => (
                <View key={r.slug} style={s.savedCol}>
                  <RecipeGridCard
                    recipe={r}
                    onPress={() => router.push(`/recipe/${r.slug}` as any)}
                    saved
                    onToggleSave={() => unsave(r.slug)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <SaveNudge />
          )}

          {/* Trust badge */}
          <View style={s.trust}>
            <IconLeaf size={sc(11)} color={colors.green} />
            <Text style={s.trustText}>grounded in classical texts + ICMR-NIN 2024</Text>
          </View>
        </ScrollView>

        {/* RN has no inset shadow, so a short top gradient casts the recess onto
            the top of the scrolling content — the lip of the tray. */}
        <LinearGradient
          colors={['rgba(42,37,30,0.14)', 'rgba(42,37,30,0)']}
          style={s.lip}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  // Header carries its own 14pt inset and stays on the bone ground; the top
  // safe-area inset is paid by the (tabs) layout, the bottom by the TabBar.
  header: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 11, gap: 11 },
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
  // The sand tray. Rounded top lip + a darker fill than bone create the recess;
  // overflow:hidden clips the scrolling content to the rounded corners.
  well: {
    flex: 1,
    backgroundColor: colors.sand,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  lip: { position: 'absolute', top: 0, left: 0, right: 0, height: 16 },
  scroll: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 24, gap: 11 },
  // Serif zone heading (prototype .zt) — one per zone.
  zone: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  zoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 10, fontFamily: fonts.sans, fontWeight: '800', color: colors.green },
  // Full-bleed chip row (negative margin cancels the 14pt gutter).
  chipsRow: { flexGrow: 0, marginHorizontal: -14 },
  chipsContent: { gap: 7, paddingHorizontal: 14 },
  // Pillar + its pulse ring overlay.
  pillarWrap: { position: 'relative' },
  ring: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18, borderWidth: 2, borderColor: colors.green,
    backgroundColor: 'rgba(62,107,79,0.06)',
  },
  savedGrid: { flexDirection: 'row', gap: 9 },
  savedCol: { flex: 1 },
  trust: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8,
  },
  trustText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
});
