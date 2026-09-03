import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts } from '../theme/tokens';
import { IconClose, IconCheck, IconHeart } from '../components/shared/icons';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useCookLog } from '../hooks/useCookLog';
import { useCookSession } from '../hooks/useCookSession';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';
import { scaledSheet, sc } from '../theme/scale';

const CTA_TEXT = '#0c1a10'; // prototype .fin-cta text color

// Offline fallback built from the slug, used only if the fetch fails.
function slugFallback(slug: string): RecipeListItem {
  return {
    slug,
    nameEn: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'solid',
    cookTimeMin: 0,
    contraCount: 0,
    fit: null,
    stepCount: 0,
  };
}

export function FinishScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { save, isSaved } = useSavedRecipes();
  const { recordMake, madeCount } = useCookLog();
  const { clearSession } = useCookSession();
  const [recipe, setRecipe] = useState<RecipeListItem>(() => slugFallback(slug ?? ''));
  const [stepsCount, setStepsCount] = useState<number | null>(null);
  const [logged, setLogged] = useState(false);
  const saved = isSaved(slug ?? '');

  const onLog = (rating?: number) => {
    if (logged || !slug) return;
    recordMake(slug, rating ? { rating } : undefined);
    setLogged(true);
  };

  useEffect(() => {
    let alive = true;
    if (!slug) return;
    recipesApi.detail(slug)
      .then((doc: RecipeDoc) => {
        if (!alive) return;
        setRecipe(toListItem(doc));
        setStepsCount(doc.steps?.length ?? null);
      })
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
        <TouchableOpacity style={s.closeBtn} onPress={() => router.push('/')}>
          <IconClose size={sc(13)} color={colors.cmMuted} />
        </TouchableOpacity>
        <View style={s.progTrack}><View style={s.progFill} /></View>
        <Text style={s.done}>Done</Text>
      </View>

      {/* Body */}
      <View style={s.body}>
        <View style={s.ring}>
          <IconCheck size={sc(32)} color={colors.cmGreen} />
        </View>
        <View style={s.titleWrap}>
          <Text style={s.wellMade}>Well made.</Text>
          <Text style={s.sub}>
            {recipe.nameEn}
            {stepsCount ? ` · ${stepsCount} steps` : ''}
            {recipe.cookTimeMin > 0 ? `\n~${recipe.cookTimeMin} min` : ''}
          </Text>
        </View>

        {/* Made-this + rating anchor (engagement + satisfaction) */}
        <View style={s.madeCard}>
          {!logged ? (
            <>
              <Text style={s.madeHeader}>How did it go?</Text>
              <View style={s.faces}>
                {[{ e: '🙁', r: 1 }, { e: '🙂', r: 3 }, { e: '😍', r: 5 }].map(f => (
                  <TouchableOpacity key={f.r} style={s.face} onPress={() => onLog(f.r)} activeOpacity={0.8}>
                    <Text style={s.faceEmoji}>{f.e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => onLog()}>
                <Text style={s.logPlain}>Just log it, no rating →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={s.loggedMsg}>
              ✓ Added to your cooked list
              {madeCount(slug ?? '') > 1 ? ` · made ${madeCount(slug ?? '')} times` : ''}
            </Text>
          )}
        </View>

        {/* Save card */}
        <View style={s.saveCard}>
          <Text style={s.saveHeader}>Keep it in your kitchen?</Text>
          <Text style={s.saveSub}>Saved recipes stay on this device and work completely offline.</Text>
          {!saved ? (
            <TouchableOpacity style={s.saveCta} onPress={() => save(recipe)} activeOpacity={0.85}>
              <IconHeart size={sc(14)} color={CTA_TEXT} />
              <Text style={s.saveCtaText}>Save recipe</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.savedMsg}>✓ Saved — available offline</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={s.ghost}>Not now</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.shelf}>store airtight · keeps 5–7 days</Text>
    </SafeAreaView>
  );
}

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.cmBg },
  top: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 14, paddingHorizontal: 14, paddingBottom: 8,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine,
    alignItems: 'center', justifyContent: 'center',
  },
  progTrack: {
    flex: 1, height: 2, borderRadius: 1, marginHorizontal: 12,
    backgroundColor: 'rgba(240,234,216,0.08)', overflow: 'hidden',
  },
  progFill: { height: '100%', width: '100%', backgroundColor: colors.cmGreen, borderRadius: 1 },
  done: {
    fontSize: 10, fontFamily: fonts.mono, fontWeight: '700',
    color: 'rgba(92,173,120,0.9)', minWidth: 32, textAlign: 'right',
  },
  body: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, paddingHorizontal: 20, paddingBottom: 8,
  },
  ring: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 2, borderColor: colors.cmGreen,
    backgroundColor: 'rgba(92,173,120,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { alignItems: 'center' },
  wellMade: {
    fontSize: 25, fontFamily: fonts.serif, fontWeight: '700',
    color: colors.cmText, letterSpacing: -0.25,
  },
  sub: {
    fontSize: 11, fontFamily: fonts.sans, color: colors.cmMuted,
    lineHeight: 17, textAlign: 'center', marginTop: 2,
  },
  madeCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(240,234,216,0.04)',
    borderWidth: 1, borderColor: 'rgba(240,234,216,0.1)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 10,
    alignItems: 'center',
  },
  madeHeader: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.cmText },
  faces: { flexDirection: 'row', gap: 14 },
  face: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine,
  },
  faceEmoji: { fontSize: 22 },
  logPlain: { fontSize: 11, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmMuted },
  loggedMsg: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmGreen, textAlign: 'center' },
  saveCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(240,234,216,0.04)',
    borderWidth: 1, borderColor: 'rgba(240,234,216,0.1)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 7,
  },
  saveHeader: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.cmGreen },
  saveSub: { fontSize: 10, fontFamily: fonts.sans, color: colors.cmMuted, lineHeight: 15 },
  saveCta: {
    backgroundColor: colors.cmGreen, borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveCtaText: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: CTA_TEXT },
  savedMsg: { fontSize: 13, fontFamily: fonts.sans, color: colors.cmGreen, textAlign: 'center', paddingVertical: 4 },
  ghost: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmMuted, padding: 4 },
  shelf: {
    fontSize: 8.5, fontFamily: fonts.mono, color: colors.cmMuted,
    textAlign: 'center', letterSpacing: 0.43, paddingBottom: 12,
  },
});
