import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Image, Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts } from '../theme/tokens';
import { IconClose, IconCheck, IconBookmark } from '../components/shared/icons';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useCookLog } from '../hooks/useCookLog';
import { useCookSession } from '../hooks/useCookSession';
import { AuthContext } from '../auth/AuthContext';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';
import { pickDishPhotos, MAX_PHOTOS, type PhotoSource } from '../media/dishPhotos';
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
  const { recordMake, rateMake, attachPhotos, removePhoto, madeCount, entries } = useCookLog();
  const { clearSession } = useCookSession();
  const { user } = useContext(AuthContext);
  const [recipe, setRecipe] = useState<RecipeListItem>(() => slugFallback(slug ?? ''));
  const [stepsCount, setStepsCount] = useState<number | null>(null);
  const [logged, setLogged] = useState(false);
  const [makeMadeAt, setMakeMadeAt] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const saved = isSaved(slug ?? '');

  // This finish's make + its photos (once one exists).
  const entry = makeMadeAt ? entries.find(e => e.slug === slug && e.madeAt === makeMadeAt) : undefined;
  const photos = entry?.photos ?? [];
  const pending = entry?.pendingPhotos ?? [];
  const photoCount = photos.length + pending.length;

  // Create the make on first interaction (rating OR photo); returns its madeAt.
  const ensureMake = (sl: string, rating?: number): string => {
    if (makeMadeAt) { if (rating) rateMake(sl, makeMadeAt, rating); return makeMadeAt; }
    const madeAt = recordMake(sl, rating ? { rating } : undefined);
    setMakeMadeAt(madeAt);
    return madeAt;
  };

  const onLog = (rating?: number) => {
    if (logged || !slug) return;
    ensureMake(slug, rating);
    setLogged(true);
  };

  // Photos require an account (they're shared with the care team) — gate in place.
  const onAddPress = () => {
    if (!slug) return;
    if (!user) { setAuthOpen(true); return; }
    setSourceOpen(true);
  };

  const pickFrom = async (source: PhotoSource) => {
    setSourceOpen(false);
    if (!slug || !user) return;
    const madeAt = ensureMake(slug);
    const remaining = MAX_PHOTOS - photoCount;
    if (remaining <= 0) return;
    setBusy(true);
    try {
      const { uris, denied } = await pickDishPhotos(source, remaining);
      if (denied) {
        Alert.alert('Access needed', 'Allow photo or camera access in Settings to add a picture of your dish.');
        return;
      }
      if (uris.length) attachPhotos(slug, madeAt, uris);
    } finally {
      setBusy(false);
    }
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
      <ScrollView style={s.bodyScroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
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

        {/* Prepared-dish photos (docs/specs/2026-09-09-prepared-photos.md) */}
        <View style={s.photoCard}>
          <Text style={s.photoHeader}>Add a photo of your dish</Text>
          <Text style={s.photoSub}>Kept in your kitchen · shared with your care team</Text>

          {photoCount > 0 && (
            <View style={s.thumbRow}>
              {photos.map(p => (
                <View key={p.publicId} style={s.thumbWrap}>
                  <Image source={{ uri: p.url }} style={s.thumb} />
                  <TouchableOpacity
                    style={s.thumbX}
                    onPress={() => removePhoto(slug!, makeMadeAt!, { publicId: p.publicId })}
                    hitSlop={6}
                  >
                    <IconClose size={sc(8)} color={colors.cmText} />
                  </TouchableOpacity>
                </View>
              ))}
              {pending.map((p, i) => (
                <View key={`${p.localUri}-${i}`} style={[s.thumbWrap, s.thumbPending]}>
                  <Image source={{ uri: p.localUri }} style={s.thumb} />
                  <View style={s.thumbBadge}>
                    {p.status === 'failed'
                      ? <Text style={s.thumbBadgeTxt}>!</Text>
                      : <ActivityIndicator size="small" color={colors.cmText} />}
                  </View>
                  <TouchableOpacity
                    style={s.thumbX}
                    onPress={() => removePhoto(slug!, makeMadeAt!, { localUri: p.localUri })}
                    hitSlop={6}
                  >
                    <IconClose size={sc(8)} color={colors.cmText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {photoCount < MAX_PHOTOS && (
            <TouchableOpacity style={s.photoCta} onPress={onAddPress} disabled={busy} activeOpacity={0.85}>
              {busy
                ? <ActivityIndicator color={colors.cmGreen} />
                : <Text style={s.photoCtaText}>{photoCount > 0 ? 'Add another' : '＋ Add photo'}</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Save card */}
        <View style={s.saveCard}>
          <Text style={s.saveHeader}>Keep it in your kitchen?</Text>
          <Text style={s.saveSub}>Saved recipes stay on this device and work completely offline.</Text>
          {!saved ? (
            <TouchableOpacity style={s.saveCta} onPress={() => save(recipe)} activeOpacity={0.85}>
              <IconBookmark size={sc(14)} color={CTA_TEXT} />
              <Text style={s.saveCtaText}>Save recipe</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.savedMsg}>✓ Saved — available offline</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={s.ghost}>Not now</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={s.shelf}>store airtight · keeps 5–7 days</Text>

      {/* Photo-source chooser */}
      <Modal visible={sourceOpen} transparent animationType="slide" onRequestClose={() => setSourceOpen(false)}>
        <Pressable style={s.mOverlay} onPress={() => setSourceOpen(false)}>
          <View style={s.mPanel}>
            <Text style={s.mTitle}>Add a photo</Text>
            <TouchableOpacity style={s.mBtn} onPress={() => pickFrom('camera')}>
              <Text style={s.mBtnText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mBtn} onPress={() => pickFrom('library')}>
              <Text style={s.mBtnText}>Choose from library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mCancel} onPress={() => setSourceOpen(false)}>
              <Text style={s.mCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Sign-in gate — photos need an account */}
      <Modal visible={authOpen} transparent animationType="slide" onRequestClose={() => setAuthOpen(false)}>
        <Pressable style={s.mOverlay} onPress={() => setAuthOpen(false)}>
          <View style={s.mPanel}>
            <Text style={s.mTitle}>Save your photos</Text>
            <Text style={s.mBody}>
              Create a free account to add photos of your dishes. They're kept in your kitchen and shared with your care team.
            </Text>
            <TouchableOpacity style={s.mPrimary} onPress={() => { setAuthOpen(false); router.push('/auth/signup'); }}>
              <Text style={s.mPrimaryText}>Create account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mBtn} onPress={() => { setAuthOpen(false); router.push('/auth/login'); }}>
              <Text style={s.mBtnText}>I already have one</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.mCancel} onPress={() => setAuthOpen(false)}>
              <Text style={s.mCancelText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  bodyScroll: { flex: 1 },
  body: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, paddingHorizontal: 20, paddingVertical: 8,
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

  photoCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(240,234,216,0.04)',
    borderWidth: 1, borderColor: 'rgba(240,234,216,0.1)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 8,
  },
  photoHeader: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.cmText },
  photoSub: { fontSize: 10, fontFamily: fonts.sans, color: colors.cmMuted, lineHeight: 15 },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  thumbWrap: { width: 58, height: 58 },
  thumb: { width: 58, height: 58, borderRadius: 10, backgroundColor: colors.cmSurf },
  thumbPending: { opacity: 0.7 },
  thumbBadge: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  thumbBadgeTxt: { color: colors.cmAmber, fontFamily: fonts.sans, fontWeight: '800', fontSize: 16 },
  thumbX: {
    position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine,
    alignItems: 'center', justifyContent: 'center',
  },
  photoCta: {
    marginTop: 2, borderWidth: 1, borderColor: colors.cmLine, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', backgroundColor: colors.cmSurf,
  },
  photoCtaText: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.cmText },

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

  // Bottom-sheet modals (source chooser + sign-in gate)
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  mPanel: {
    backgroundColor: colors.cmSurf,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: colors.cmLine,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, gap: 8,
  },
  mTitle: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.cmText, textAlign: 'center', marginBottom: 2 },
  mBody: { fontSize: 12, fontFamily: fonts.sans, color: colors.cmMuted, lineHeight: 18, textAlign: 'center', marginBottom: 4 },
  mBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: colors.cmBg, borderWidth: 1, borderColor: colors.cmLine,
  },
  mBtnText: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmText },
  mPrimary: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.cmGreen },
  mPrimaryText: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: CTA_TEXT },
  mCancel: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  mCancelText: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmMuted },
});
