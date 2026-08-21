import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
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

// Placeholder data; replaced by recipesApi.get(slug) in the wiring wave.
const PLACEHOLDER = {
  nameEn: 'Paavakkai Pitla',
  nameTa: 'பாவக்காய் பிட்லா',
  sources: ['Samayamulu', 'Arogya Padasastra'],
  yield: '2 servings',
  shelfLife: '4h · refrigerate',
  contraConditions: ['Pregnancy — bitter melon stimulates uterine contractions'],
  ingredients: [
    { name: 'Bitter melon', amountG: 150, amountCup: '1 cup' },
    { name: 'Toor dal', amountG: 80, amountCup: '⅓ cup' },
    { stage: 'Seasoning' } as any,
    { name: 'Mustard seeds', amountG: 4, amountCup: '1 tsp' },
  ],
  steps: [
    { phase: 'Prep', text: 'Wash and slice bitter melon into thin rounds. Soak toor dal for 20 minutes.' },
    { phase: 'Cook', text: 'Pressure cook dal until soft. In a pan, temper mustard seeds in oil.' },
  ],
};

export function RecipeDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [unit, setUnit] = useState<'g' | 'cup'>('g');
  const recipe = PLACEHOLDER; // TODO: fetch by slug

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
