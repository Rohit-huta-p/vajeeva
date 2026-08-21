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
import { recipesApi } from '../api/recipes';
import type { RecipeDoc } from '../api/recipes';

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
        {/* Hero */}
        <View style={s.hero}>
          <IconButton icon="←" onPress={() => router.back()} style={s.backBtn} />
        </View>
        <View style={s.body}>
          {/* Title */}
          <Text style={s.title}>{recipe.nameEn}</Text>
          <Text style={s.tamil}>{recipe.nameTa}</Text>

          {/* Sources */}
          <SectionLabel label="Classical Sources" />
          <View style={s.sourceRow}>
            {recipe.sources.map(src => (
              <SourcePill key={src} name={src} onPress={() => router.push(`/source/${src}` as any)} />
            ))}
          </View>

          {/* Yield / shelf */}
          <View style={s.badges}>
            <View style={s.badge}><Text style={s.badgeText}>{recipe.yield}</Text></View>
            <View style={s.badge}><Text style={s.badgeText}>{recipe.shelfLife}</Text></View>
          </View>

          {/* Contra */}
          <ContraCard conditions={recipe.contraConditions} />

          {/* Ingredients */}
          <View style={s.section}>
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
          <View style={s.section}>
            <Text style={s.sectionTitle}>Method</Text>
            <StepList steps={recipe.steps} />
          </View>

          {/* CTA */}
          <CTA label="Start Cook Mode" icon="▶" onPress={() => router.push(`/cook/${slug}` as any)} />
          <Disclaimer text="Consult a qualified practitioner before making dietary changes based on classical Ayurvedic texts." />
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
    backgroundColor: colors.greenSoft,
    justifyContent: 'flex-end', padding: spacing.md,
  },
  backBtn: { position: 'absolute', top: spacing.lg, left: spacing.md },
  body: { padding: spacing.lg },
  title: { fontSize: 22, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, letterSpacing: -0.01 * 22, marginBottom: 4 },
  tamil: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.amber, marginBottom: spacing.md },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  badge: { backgroundColor: colors.sand, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2 },
  section: { marginBottom: spacing.xl },
  ingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { flex: 1, fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.sand, borderRadius: 8, padding: 2,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleActive: { backgroundColor: colors.green },
  toggleLabel: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2 },
  toggleLabelActive: { color: colors.onGreen, fontWeight: '700' },
});
