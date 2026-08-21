import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import type { CookModeProps } from '../navigation/types';
import type { Recipe } from '../components/RecipeCard';
import StepCard from '../components/StepCard';
import { colors } from '../theme';
import { recipesApi } from '../api';

export default function CookModeScreen({ route, navigation }: CookModeProps) {
  const { slug } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await recipesApi.detail(slug);
        if (mounted) setRecipe(data);
      } catch (e) {
        console.warn('Failed to load recipe', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  if (!recipe) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.cmBg }} color={colors.cmGreen} />;

  const steps = [...recipe.steps].sort((a, b) => a.order - b.order);
  const step = steps[stepIdx];
  const total = steps.length;
  const progress = (stepIdx + 1) / total;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;

  const illBg = step.illColor ? `${step.illColor}22` : colors.cmSurf;

  return (
    <View style={[s.root, { backgroundColor: colors.cmBg }]}>
      <StatusBar barStyle="light-content" />

      <View style={s.progLine}>
        <View style={[s.progFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={s.bar}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={s.closeX}>✕</Text>
        </TouchableOpacity>
        <View style={s.dots}>
          {steps.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setStepIdx(i)}>
              <View style={[s.dot,
                i === stepIdx && s.dotActive,
                i < stepIdx  && s.dotDone,
              ]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.stepLabel}>{stepIdx + 1}/{total}</Text>
      </View>

      <View style={s.phaseStrip}>
        <Text style={s.phaseText}>{step.phase}</Text>
      </View>

      <View style={[s.ill, { backgroundColor: illBg }]}>
        <Text style={{ fontSize: 36 }}>🍲</Text>
      </View>

      <View style={s.body}>
        <StepCard step={step} />
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.navBtn, s.prevBtn, isFirst && s.disabled]}
          onPress={() => !isFirst && setStepIdx(i => i - 1)}
          disabled={isFirst}>
          <Text style={s.prevText}>← Prev</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity style={[s.navBtn, s.nextBtn]} onPress={() => navigation.goBack()}>
            <Text style={s.nextText}>Finish ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.navBtn, s.nextBtn]} onPress={() => setStepIdx(i => i + 1)}>
            <Text style={s.nextText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  progLine:  { height: 2, backgroundColor: 'rgba(240,234,216,0.06)' },
  progFill:  { height: '100%', backgroundColor: colors.cmAmber, borderRadius: 1 },
  bar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
               paddingTop: 10, paddingBottom: 8, gap: 0 },
  closeBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.cmSurf,
               alignItems: 'center', justifyContent: 'center',
               borderWidth: 1, borderColor: colors.cmLine },
  closeX:    { color: colors.cmMuted, fontSize: 13 },
  dots:      { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cmSurf2 },
  dotActive: { width: 20, backgroundColor: colors.cmAmber },
  dotDone:   { backgroundColor: 'rgba(92,173,120,0.5)' },
  stepLabel: { fontFamily: 'mono', fontSize: 10, color: colors.cmMuted,
               fontWeight: '700', minWidth: 32, textAlign: 'right' },
  phaseStrip: { paddingHorizontal: 18, paddingBottom: 10 },
  phaseText:  { fontFamily: 'mono', fontSize: 9, letterSpacing: 2,
                 textTransform: 'uppercase', color: colors.cmAmber, fontWeight: '700' },
  ill:        { height: 94, marginHorizontal: 18, borderRadius: 14,
                 alignItems: 'center', justifyContent: 'center' },
  body:       { flex: 1, paddingHorizontal: 18, paddingTop: 14 },
  footer:     { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10,
                 borderTopWidth: 1, borderTopColor: colors.cmLine },
  navBtn:     { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
                 justifyContent: 'center' },
  prevBtn:    { backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine },
  nextBtn:    { backgroundColor: colors.cmGreen },
  prevText:   { color: 'rgba(240,234,216,0.65)', fontWeight: '800', fontSize: 13 },
  nextText:   { color: '#0c1a10', fontWeight: '800', fontSize: 13 },
  disabled:   { opacity: 0.3 },
});
