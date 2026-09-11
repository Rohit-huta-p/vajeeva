import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, Modal, Pressable, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { scaledSheet, sc } from '../../theme/scale';
import { AuthContext } from '../../auth/AuthContext';
import { cloudThumb } from '../../api/recipes';
import { pickDishPhotos, MAX_PHOTOS, type PhotoSource } from '../../media/dishPhotos';
import type { UseCookLog } from '../../hooks/useCookLog';
import { IconClose } from './icons';

// "Your photos" — the recipe-detail re-entry point (docs/specs/2026-09-09-prepared-photos.md §6).
// Shows the patient's photos for THIS recipe across all their makes, and adds more.
// Reuses the parent screen's single useCookLog instance (passed as `cook`) so the
// on-device state never forks. Photos require an account — the add flow gates to
// sign-in in place, matching the finish screen.
export function RecipePhotos({ slug, cook }: { slug?: string; cook: UseCookLog }) {
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { entries, recordMake, attachPhotos, removePhoto } = cook;

  const [captureMadeAt, setCaptureMadeAt] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // All photos for this recipe across makes, newest make first; each tagged with
  // its make's madeAt so removal targets the right row.
  const recipePhotos = slug
    ? entries
        .filter(e => e.slug === slug)
        .sort((a, b) => (a.madeAt < b.madeAt ? 1 : -1))
        .flatMap(e => (e.photos ?? []).map(p => ({ ...p, madeAt: e.madeAt })))
    : [];

  const captureEntry = captureMadeAt ? entries.find(e => e.slug === slug && e.madeAt === captureMadeAt) : undefined;
  const pending = captureEntry?.pendingPhotos ?? [];
  const captureCount = (captureEntry?.photos?.length ?? 0) + pending.length;
  const total = recipePhotos.length + pending.length;

  // Hang the photos on a make. Reuse one from today — e.g. a just-tapped "I made
  // this" right above — rather than forking a second make for the same cooking;
  // only log a fresh one if the patient hasn't recorded this recipe today.
  const ensureMake = (): string => {
    if (captureMadeAt) return captureMadeAt;
    const today = new Date().toDateString();
    const recent = entries
      .filter(e => e.slug === slug && new Date(e.madeAt).toDateString() === today)
      .sort((a, b) => (a.madeAt < b.madeAt ? 1 : -1))[0];
    const madeAt = recent ? recent.madeAt : recordMake(slug!);
    setCaptureMadeAt(madeAt);
    return madeAt;
  };

  const onAddPress = () => {
    if (!slug) return;
    if (!user) { setAuthOpen(true); return; }
    setSourceOpen(true);
  };

  const pickFrom = async (source: PhotoSource) => {
    setSourceOpen(false);
    if (!slug || !user) return;
    const madeAt = ensureMake();
    const remaining = MAX_PHOTOS - captureCount;
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

  return (
    <View style={s.wrap}>
      <Text style={s.header}>Your photos</Text>

      {total > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
          {pending.map((p, i) => (
            <View key={`pend-${p.localUri}-${i}`} style={[s.thumbWrap, s.pendingWrap]}>
              <Image source={{ uri: p.localUri }} style={s.thumb} />
              <View style={s.badge}>
                {p.status === 'failed'
                  ? <Text style={s.badgeTxt}>!</Text>
                  : <ActivityIndicator size="small" color="#fff" />}
              </View>
              <TouchableOpacity style={s.x} hitSlop={6} onPress={() => removePhoto(slug!, captureMadeAt!, { localUri: p.localUri })}>
                <IconClose size={sc(8)} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {recipePhotos.map(p => (
            <View key={p.publicId} style={s.thumbWrap}>
              <Image source={{ uri: cloudThumb(p.url, 200, 200) }} style={s.thumb} />
              <TouchableOpacity style={s.x} hitSlop={6} onPress={() => removePhoto(slug!, p.madeAt, { publicId: p.publicId })}>
                <IconClose size={sc(8)} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={s.empty}>Add a photo of how yours turned out — it's saved to your kitchen.</Text>
      )}

      {captureCount < MAX_PHOTOS && (
        <TouchableOpacity style={s.addBtn} onPress={onAddPress} disabled={busy} activeOpacity={0.85}>
          {busy
            ? <ActivityIndicator />
            : <Text style={s.addTxt}>{total > 0 ? '+ Add another' : '+ Add photo'}</Text>}
        </TouchableOpacity>
      )}

      {/* Source chooser */}
      <Modal visible={sourceOpen} transparent animationType="slide" onRequestClose={() => setSourceOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setSourceOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Add a photo</Text>
            <TouchableOpacity style={s.sheetBtn} onPress={() => pickFrom('camera')}>
              <Text style={s.sheetBtnTxt}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetBtn} onPress={() => pickFrom('library')}>
              <Text style={s.sheetBtnTxt}>Choose from library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setSourceOpen(false)}>
              <Text style={s.sheetCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Sign-in gate — photos need an account */}
      <Modal visible={authOpen} transparent animationType="slide" onRequestClose={() => setAuthOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setAuthOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Save your photos</Text>
            <Text style={s.sheetBody}>
              Create a free account to add photos of your dishes. They're kept in your kitchen and shared with your care team.
            </Text>
            <TouchableOpacity style={s.sheetPrimary} onPress={() => { setAuthOpen(false); router.push('/auth/signup' as any); }}>
              <Text style={s.sheetPrimaryTxt}>Create account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetBtn} onPress={() => { setAuthOpen(false); router.push('/auth/login' as any); }}>
              <Text style={s.sheetBtnTxt}>I already have one</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setAuthOpen(false)}>
              <Text style={s.sheetCancelTxt}>Not now</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  wrap: { alignSelf: 'stretch', gap: 8, marginTop: 2 },
  header: { fontSize: 13, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  strip: { gap: 10, paddingVertical: 2, paddingRight: 8 },
  empty: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.muted, lineHeight: 16 },
  thumbWrap: { width: 76, height: 76 },
  thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: colors.sand },
  pendingWrap: { opacity: 0.75 },
  badge: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontFamily: fonts.sans, fontWeight: '800', fontSize: 18 },
  x: {
    position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(20,18,15,0.72)', alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: 11,
    paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.cream,
  },
  addTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.green },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, gap: 8,
  },
  sheetTitle: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 2 },
  sheetBody: { fontSize: 12, fontFamily: fonts.sans, color: colors.ink2, lineHeight: 18, textAlign: 'center', marginBottom: 4 },
  sheetBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: colors.bone, borderWidth: 1, borderColor: colors.line,
  },
  sheetBtnTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  sheetPrimary: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.green },
  sheetPrimaryTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
  sheetCancel: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  sheetCancelTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.muted },
});
