import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, type Colors } from '../../theme/tokens';
import { useThemedStyles } from '../../theme/ThemeContext';
import { scaledSheet } from '../../theme/scale';
import { AuthContext } from '../../auth/AuthContext';
import { cloudThumb } from '../../api/recipes';
import type { UseCookLog } from '../../hooks/useCookLog';
import { PhotoUploadModal } from './PhotoUploadModal';

// "Your photos" — the recipe-detail re-entry point (docs/specs/2026-09-09-prepared-photos.md §6).
// A read-only preview of the patient's photos for this recipe; the "Add / manage
// photos" button opens the full upload + CRUD modal. Reuses the parent screen's
// single useCookLog instance (`cook`) so state never forks. Photos require an
// account — the button gates to sign-in in place.
export function RecipePhotos({ slug, cook }: { slug?: string; cook: UseCookLog }) {
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { entries, recordMake } = cook;

  const [captureMadeAt, setCaptureMadeAt] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // All photos for this recipe across makes, newest make first.
  const recipePhotos = slug
    ? entries
        .filter(e => e.slug === slug)
        .sort((a, b) => (a.madeAt < b.madeAt ? 1 : -1))
        .flatMap(e => (e.photos ?? []).map(p => ({ ...p, madeAt: e.madeAt })))
    : [];

  // Reuse today's make (e.g. a just-tapped "I made this") rather than forking one;
  // only log a fresh make if the recipe wasn't recorded today.
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
    setModalOpen(true);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.header}>Your photos</Text>

      {recipePhotos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
          {recipePhotos.map(p => (
            <TouchableOpacity key={p.publicId} activeOpacity={0.85} onPress={onAddPress}>
              <Image source={{ uri: cloudThumb(p.url, 200, 200) }} style={s.thumb} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={s.empty}>Show off how yours turned out — your care team loves seeing it.</Text>
      )}

      <TouchableOpacity style={s.addBtn} onPress={onAddPress} activeOpacity={0.85}>
        <Text style={s.addTxt}>{recipePhotos.length > 0 ? '📸  Add another' : '📸  Show off your dish'}</Text>
      </TouchableOpacity>

      {slug && (
        <PhotoUploadModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          slug={slug}
          cook={cook}
          resolveMakeId={ensureMake}
        />
      )}

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
  thumb: { width: 76, height: 76, borderRadius: 12, backgroundColor: colors.sand },
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
