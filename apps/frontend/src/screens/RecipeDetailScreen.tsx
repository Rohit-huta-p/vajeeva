import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { ContraCard } from '../components/shared/ContraCard';
import { IngredientTable } from '../components/shared/IngredientTable';
import { StepList } from '../components/shared/StepList';
import { SourcePill } from '../components/shared/SourcePill';
import { CTA } from '../components/shared/CTA';
import { Disclaimer } from '../components/shared/Disclaimer';
import { SectionLabel } from '../components/shared/SectionLabel';
import { IconButton } from '../components/shared/IconButton';
import { IconBack, IconHeart, IconShare, IconPlay, IllHero } from '../components/shared/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { recipesApi } from '../api/recipes';
import type { RecipeDoc } from '../api/recipes';

// Matches the API's Source slug scheme (lowercase, non-alphanumeric -> '-').
function toSourceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface DetailView {
  nameEn: string;
  nameTa?: string;
  sources: string[];
  yield: string;
  shelfLife: string;
  contraConditions: string[];
  ingredients: { name: string; amountG: number; amountCup?: string }[];
  steps: { phase?: string; text: string }[];
}

function toDetailView(doc: RecipeDoc): DetailView {
  return {
    nameEn: doc.nameEn,
    nameTa: doc.nameTa,
    sources: (doc.sources ?? []).map(src => src.text),
    yield: doc.yieldStr ?? '',
    shelfLife: doc.shelfLife ?? '',
    contraConditions: (doc.healthFlags ?? [])
      .filter(f => f.severity !== 'safe')
      .map(f => `${f.condition.charAt(0).toUpperCase() + f.condition.slice(1)}${f.note ? ` — ${f.note}` : ''}`),
    ingredients: (doc.ingredients ?? []).map(ing => ({
      name: ing.nameEn,
      amountG: parseInt(ing.quantityG ?? '', 10) || 0,
      amountCup: ing.quantityCup,
    })),
    steps: [...(doc.steps ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(st => ({ phase: st.phase, text: st.text })),
  };
}

export function RecipeDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [unit, setUnit] = useState<'g' | 'cup'>('g');
  const [recipe, setRecipe] = useState<DetailView | null>(null);

  useEffect(() => {
    let alive = true;
    if (!slug) return;
    recipesApi.detail(slug)
      .then((doc: RecipeDoc) => { if (alive) setRecipe(toDetailView(doc)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (!recipe) {
    return (
      <SafeAreaView style={s.root}>
        <ActivityIndicator style={s.loading} color={colors.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Illustration hero */}
        <LinearGradient colors={[colors.greenSoft, colors.sand]} style={s.hero}>
          <View style={s.heroBar}>
            <IconButton icon={<IconBack size={15} color={colors.ink} />} onPress={() => router.back()} />
            <View style={s.heroActs}>
              <IconButton icon={<IconHeart size={15} color={colors.clay} />} onPress={() => {}} />
              <IconButton icon={<IconShare size={15} color={colors.ink} />} onPress={() => {}} />
            </View>
          </View>
          <IllHero width={174} height={130} />
        </LinearGradient>
        <View style={s.body}>
          {/* Title */}
          <View>
            <Text style={s.title}>{recipe.nameEn}</Text>
            {recipe.nameTa ? <Text style={s.tamil}>{recipe.nameTa}</Text> : null}
          </View>

          {/* Sources */}
          <View>
            <SectionLabel label="Classical sources" />
            <View style={s.sourceRow}>
              {recipe.sources.map(src => (
                <SourcePill key={src} name={src} onPress={() => router.push(`/source/${toSourceSlug(src)}` as any)} />
              ))}
            </View>
          </View>

          {/* Yield / shelf */}
          <View style={s.badges}>
            {recipe.yield ? <View style={s.badge}><Text style={s.badgeText}>🫙 {recipe.yield}</Text></View> : null}
            {recipe.shelfLife ? <View style={s.badge}><Text style={s.badgeText}>📅 {recipe.shelfLife}</Text></View> : null}
          </View>

          {/* Contra */}
          <ContraCard conditions={recipe.contraConditions} />

          {/* Ingredients */}
          <View>
            <View style={s.ingHeader}>
              <Text style={s.sectionTitle}>Ingredients</Text>
              <View style={s.toggle}>
                {(['g', 'cup'] as const).map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[s.toggleBtn, unit === u && s.toggleActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[s.toggleLabel, unit === u && s.toggleLabelActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <IngredientTable ingredients={recipe.ingredients} unit={unit} />
          </View>

          {/* Method */}
          <View>
            <Text style={[s.sectionTitle, s.methodTitle]}>Method</Text>
            <SectionLabel label={`${recipe.steps.length} steps · cook mode`} />
            <StepList steps={recipe.steps} />
          </View>

          {/* CTA */}
          <CTA label="Start Cook" icon={<IconPlay size={15} color={colors.onGreen} />} onPress={() => router.push(`/cook/${slug}` as any)} />
          <Disclaimer text="Supportive dietary guidance · not a substitute for medical advice" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  loading: { flex: 1 },
  hero: {
    height: 172,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBar: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 2,
  },
  heroActs: { flexDirection: 'row', gap: 6 },
  body: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 14, gap: 13 },
  title: { fontSize: 22, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, letterSpacing: -0.22, lineHeight: 25 },
  tamil: { fontSize: 13, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 3 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge: { backgroundColor: colors.sand, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2 },
  ingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  methodTitle: { marginBottom: 2 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.sand, borderRadius: 6, padding: 2, gap: 2,
  },
  toggleBtn: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 4 },
  toggleActive: { backgroundColor: colors.green },
  toggleLabel: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.36, color: colors.muted },
  toggleLabelActive: { color: '#fff' },
});
