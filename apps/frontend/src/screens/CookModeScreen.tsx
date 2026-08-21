import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PanResponder, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { TimerPill } from '../components/shared/TimerPill';
import { CookDots } from '../components/shared/CookDots';
import { useCookSession } from '../hooks/useCookSession';
import { recipesApi, parseTimerMin } from '../api/recipes';
import type { RecipeDoc } from '../api/recipes';

interface CookStep { phase: string; text: string; timerSec: number }

export function CookModeScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState<CookStep[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const current = steps[step];
  const { startSession, updateStep } = useCookSession();

  // Fetch the recipe, then persist the session so HomeScreen can offer
  // "Continue cooking" with real title/texture.
  useEffect(() => {
    let alive = true;
    if (!slug) return;
    recipesApi.detail(slug).then((doc: RecipeDoc) => {
      if (!alive) return;
      const cookSteps = [...(doc.steps ?? [])]
        .sort((a, b) => a.order - b.order)
        .map(st => ({
          phase: (st.phase ?? '').toUpperCase(),
          text: st.text,
          timerSec: parseTimerMin(st.timerStr) * 60,
        }));
      setSteps(cookSteps);
      startSession({
        slug,
        title: doc.nameEn,
        texture: doc.category,
        stepIndex: 0,
        totalSteps: cookSteps.length,
        startedAt: Date.now(),
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, [slug, startSession]);

  useEffect(() => { updateStep(step); }, [step, updateStep]);

  // Web wake lock — keeps the screen on while cooking
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      let lock: any;
      (navigator as any).wakeLock.request('screen').then((l: any) => { lock = l; }).catch(() => {});
      return () => { lock?.release?.(); };
    }
  }, []);

  const goNext = useCallback(() => {
    if (step >= steps.length - 1) {
      router.replace(`/finish/${slug}`);
    } else {
      setStep(s => s + 1);
      setTimerRunning(false);
      setTimerDone(false);
    }
  }, [step, steps.length, slug, router]);

  const goPrev = useCallback(() => {
    if (step > 0) { setStep(s => s - 1); setTimerRunning(false); setTimerDone(false); }
  }, [step]);

  const jumpTo = useCallback((i: number) => {
    setStep(i);
    setTimerRunning(false);
    setTimerDone(false);
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, { dx }) => {
      if (dx < -44) goNext();
      else if (dx > 44) goPrev();
    },
  });

  if (!current) {
    return (
      <View style={[s.root, s.loadingRoot]}>
        <ActivityIndicator color={colors.cmGreen} />
      </View>
    );
  }

  const progress = (step + 1) / steps.length;

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      {/* Progress bar */}
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>
      <SafeAreaView style={s.safe}>
        {/* Nav bar */}
        <View style={s.navbar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <CookDots total={steps.length} current={step} onJump={jumpTo} />
          <Text style={s.counter}>{step + 1}/{steps.length}</Text>
        </View>

        {/* Content */}
        <View style={s.content}>
          <Text style={s.phase}>{current.phase}</Text>
          <Text style={s.stepText}>{current.text}</Text>
          <View style={s.illus} />
          {current.timerSec > 0 ? (
            <TimerPill
              seconds={current.timerSec}
              running={timerRunning}
              onToggle={() => setTimerRunning(r => !r)}
              done={timerDone}
            />
          ) : null}
        </View>

        {/* Footer nav */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.footBtn, s.footPrev, step === 0 && s.footPrevDim]}
            onPress={goPrev}
            disabled={step === 0}
          >
            <Text style={s.footPrevTxt}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.footBtn, s.footNext]} onPress={goNext}>
            <Text style={s.footNextTxt}>{step === steps.length - 1 ? 'Finish ✓' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.caption}>screen stays awake · swipe to navigate · works offline</Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cmBg },
  loadingRoot: { alignItems: 'center', justifyContent: 'center' },
  track: { height: 2, backgroundColor: colors.cmLine },
  fill: { height: 2, backgroundColor: colors.cmAmber },
  safe: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 8,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cmSurf, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 14, color: colors.cmText, opacity: 0.6 },
  counter: { flex: 0, fontSize: 11, fontFamily: fonts.mono, color: colors.cmMuted, marginLeft: 'auto' },
  content: { flex: 1, padding: spacing.lg },
  phase: {
    fontSize: 9, fontFamily: fonts.mono, color: colors.cmAmber,
    letterSpacing: 0.18, marginBottom: spacing.md,
  },
  stepText: {
    fontSize: 20, fontFamily: fonts.serif, fontWeight: '700',
    color: colors.cmText, lineHeight: 28, marginBottom: 24,
  },
  illus: {
    height: 94, borderRadius: 14, backgroundColor: colors.cmSurf,
    marginBottom: 20,
  },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  footBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  footPrev: {
    backgroundColor: colors.cmSurf,
    borderWidth: 1, borderColor: colors.cmLine,
  },
  footPrevDim: { opacity: 0.3 },
  footPrevTxt: { fontSize: 14, fontFamily: fonts.sans, color: colors.cmText, opacity: 0.65 },
  footNext: { backgroundColor: colors.cmGreen },
  footNextTxt: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmBg },
  caption: {
    fontSize: 8, fontFamily: fonts.mono, color: colors.cmMuted,
    textAlign: 'center', marginBottom: spacing.lg,
  },
});
