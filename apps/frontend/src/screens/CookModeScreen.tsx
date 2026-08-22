import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, PanResponder, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../theme/tokens';
import { TimerPill } from '../components/shared/TimerPill';
import { CookDots } from '../components/shared/CookDots';
import { IconBack, IconChev, IconCheck, IconClose, IconFlame, CategoryIll } from '../components/shared/icons';
import { useCookSession } from '../hooks/useCookSession';
import { ImageCarousel } from '../components/shared/ImageCarousel';
import { recipesApi, parseTimerMin, sortImages, cloudThumb } from '../api/recipes';
import type { RecipeDoc, RecipeImage } from '../api/recipes';
import { scaledSheet, sc } from '../theme/scale';

interface CookStep { phase: string; text: string; timerSec: number; heat: string | null; images: RecipeImage[] }

const NEXT_TEXT = '#0c1a10'; // prototype .cm-nav.next text color
const PREV_TEXT = 'rgba(240,234,216,0.65)';

export function CookModeScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState<CookStep[]>([]);
  const [category, setCategory] = useState('solid');
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
          heat: st.heat ?? null,
          // illus-box-sized Cloudinary transform (full-width box, h94 @3x)
          images: sortImages(st.images).map(im => ({ ...im, url: cloudThumb(im.url, 1100, 290) })),
        }));
      setSteps(cookSteps);
      setCategory(doc.category);
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
  const isLast = step === steps.length - 1;

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <SafeAreaView style={s.safe}>
        {/* Progress bar — inside the safe area so it sits below the system
            status bar on device (root paints the dark safe-area background) */}
        <View style={s.track}>
          <LinearGradient
            colors={[colors.cmAmber, '#E8B44A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.fill, { width: `${Math.round(progress * 100)}%` as any }]}
          />
        </View>
        {/* Nav bar */}
        <View style={s.navbar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <IconClose size={sc(13)} color={colors.cmMuted} />
          </TouchableOpacity>
          <CookDots total={steps.length} current={step} onJump={jumpTo} />
          <Text style={s.counter}>{step + 1} / {steps.length}</Text>
        </View>

        {/* Phase strip */}
        <View style={s.phaseStrip}>
          <Text style={s.phase}>Phase · {current.phase}</Text>
        </View>

        {/* Content */}
        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
          <Text style={s.stepText}>{current.text}</Text>
          {current.images.length ? (
            <ImageCarousel images={current.images} height={sc(94)} radius={sc(14)} placeholderColor={colors.cmSurf} />
          ) : (
            <View style={s.illus}>
              <CategoryIll category={category} size={sc(76)} />
            </View>
          )}
          <View style={s.infoRow}>
            {current.heat ? (
              <View style={s.heat}>
                <IconFlame size={sc(11)} color={colors.cmMuted} />
                <Text style={s.heatText}>
                  {/* prototype copy: "Low heat" / "Medium heat" */}
                  {current.heat.charAt(0).toUpperCase() + current.heat.slice(1)}
                  {/heat/i.test(current.heat) ? '' : ' heat'}
                </Text>
              </View>
            ) : <View />}
            {current.timerSec > 0 ? (
              <TimerPill
                seconds={current.timerSec}
                running={timerRunning}
                onToggle={() => setTimerRunning(r => !r)}
                done={timerDone}
              />
            ) : null}
          </View>
        </ScrollView>

        {/* Footer nav */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.footBtn, s.footPrev, step === 0 && s.footPrevDim]}
            onPress={goPrev}
            disabled={step === 0}
          >
            <IconBack size={sc(13)} color={PREV_TEXT} />
            <Text style={s.footPrevTxt}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.footBtn, s.footNext]} onPress={goNext}>
            <Text style={s.footNextTxt}>{isLast ? 'Finish' : 'Next'}</Text>
            {isLast ? <IconCheck size={sc(13)} color={NEXT_TEXT} /> : <IconChev size={sc(13)} color={NEXT_TEXT} />}
          </TouchableOpacity>
        </View>
        <Text style={s.caption}>screen stays awake · swipe to navigate · works offline</Text>
      </SafeAreaView>
    </View>
  );
}

// Default export kept for the legacy react-navigation TabNavigator until FE-12 removes it.
export default CookModeScreen;

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.cmBg },
  loadingRoot: { alignItems: 'center', justifyContent: 'center' },
  track: { height: 2, backgroundColor: colors.cmLine },
  fill: { height: 2, borderTopRightRadius: 1, borderBottomRightRadius: 1 },
  safe: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine,
    alignItems: 'center', justifyContent: 'center',
  },
  counter: {
    fontSize: 10, fontFamily: fonts.mono, fontWeight: '700', color: colors.cmMuted,
    minWidth: 32, textAlign: 'right',
  },
  phaseStrip: { paddingTop: 2, paddingHorizontal: 18, paddingBottom: 10 },
  phase: {
    fontSize: 9, fontFamily: fonts.mono, fontWeight: '700', color: colors.cmAmber,
    letterSpacing: 1.62, textTransform: 'uppercase',
  },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 18, gap: 13, paddingBottom: 17 },
  stepText: {
    fontSize: 20, fontFamily: fonts.serif, fontWeight: '700',
    color: colors.cmText, lineHeight: 27.6, letterSpacing: -0.2,
  },
  illus: {
    height: 94, borderRadius: 14, backgroundColor: colors.cmSurf,
    alignItems: 'center', justifyContent: 'center',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heatText: {
    fontSize: 9.5, fontFamily: fonts.mono, fontWeight: '700', color: colors.cmMuted,
    letterSpacing: 0.38,
  },
  footer: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 13, paddingTop: 9, paddingBottom: 6,
    borderTopWidth: 1, borderTopColor: colors.cmLine,
  },
  footBtn: {
    flex: 1, padding: 13, borderRadius: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  footPrev: {
    backgroundColor: colors.cmSurf,
    borderWidth: 1, borderColor: colors.cmLine,
  },
  footPrevDim: { opacity: 0.3 },
  footPrevTxt: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '800', color: PREV_TEXT },
  footNext: { backgroundColor: colors.cmGreen },
  footNextTxt: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '800', color: NEXT_TEXT },
  caption: {
    fontSize: 8, fontFamily: fonts.mono, color: colors.cmMuted,
    textAlign: 'center', letterSpacing: 0.4, paddingTop: 4, paddingBottom: 10,
  },
});
