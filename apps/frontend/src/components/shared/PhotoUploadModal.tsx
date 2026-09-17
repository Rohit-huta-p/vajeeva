import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, Modal, Animated, Easing,
  Alert, ActivityIndicator, AccessibilityInfo, StyleSheet,
} from 'react-native';
import { colors as tokens, fonts, type Colors } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { scaledSheet, sc } from '../../theme/scale';
import { uploadsApi, cloudThumb } from '../../api/recipes';
import type { PhotoRef } from '../../api/recipes';
import type { UseCookLog } from '../../hooks/useCookLog';
import { pickDishPhotos, MAX_PHOTOS, type PhotoSource } from '../../media/dishPhotos';
import { IconClose, IconCheck } from './icons';

interface Staged {
  id: string;
  localUri: string;
  progress: number;                       // 0–100
  status: 'uploading' | 'done' | 'failed';
  url?: string;
  publicId?: string;
}

// Colours the modal needs, so it can render in the surface's theme: the dark
// cook-mode palette when opened over the finish screen ('cm'), else the app theme.
interface Pal {
  scrim: string; panel: string; text: string; sub: string;
  surface: string; line: string; thumbBg: string; accent: string; onAccent: string; addBg: string;
}
const CM_PAL: Pal = {
  scrim: 'rgba(0,0,0,0.6)', panel: tokens.cmSurf, text: tokens.cmText, sub: tokens.cmMuted,
  surface: tokens.cmBg, line: tokens.cmLine, thumbBg: tokens.cmBg, accent: tokens.cmGreen,
  onAccent: '#0c1a10', addBg: tokens.cmBg,
};
const appPal = (c: Colors): Pal => ({
  scrim: 'rgba(0,0,0,0.45)', panel: c.cream, text: c.ink, sub: c.ink2,
  surface: c.sand, line: c.line, thumbBg: c.sand, accent: c.green, onAccent: c.onGreen, addBg: c.bone,
});

// The one place photos are added/managed for a recipe: pick → live upload with
// progress → Save (attach to the make) → success feedback → close. Also lists the
// already-saved photos with remove, so it is the full CRUD surface (§ prepared-photos).
export function PhotoUploadModal({ visible, onClose, slug, cook, resolveMakeId, variant = 'app' }: {
  visible: boolean;
  onClose: () => void;
  slug: string;
  cook: UseCookLog;
  resolveMakeId: () => string;
  variant?: 'app' | 'cm';
}) {
  const { colors: themeColors } = useTheme();
  const pal = variant === 'cm' ? CM_PAL : appPal(themeColors);
  const s = useMemo(() => makeStyles(pal), [pal]);

  const [staged, setStaged] = useState<Staged[]>([]);
  const [chooser, setChooser] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const enter = useRef(new Animated.Value(0)).current;
  const success = useRef(new Animated.Value(0)).current;

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion); }, []);

  useEffect(() => {
    if (!visible) return;
    setStaged([]); setChooser(false); setSaved(false);
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [visible, enter]);

  const existing = cook.entries
    .filter(e => e.slug === slug)
    .sort((a, b) => (a.madeAt < b.madeAt ? 1 : -1))
    .flatMap(e => (e.photos ?? []).map(p => ({ ...p, madeAt: e.madeAt })));

  const total = existing.length + staged.length;
  const uploading = staged.filter(x => x.status === 'uploading').length;
  const done = staged.filter(x => x.status === 'done').length;
  const canSave = done > 0 && uploading === 0 && !saved;

  function uploadOne(localUri: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setStaged(prev => [...prev, { id, localUri, progress: 0, status: 'uploading' }]);
    uploadsApi.uploadPhoto(localUri, pct =>
      setStaged(prev => prev.map(x => (x.id === id ? { ...x, progress: pct } : x))),
    )
      .then(({ url, publicId }) =>
        setStaged(prev => prev.map(x => (x.id === id ? { ...x, status: 'done', progress: 100, url, publicId } : x))))
      .catch(() =>
        setStaged(prev => prev.map(x => (x.id === id ? { ...x, status: 'failed' } : x))));
  }

  async function pick(source: PhotoSource) {
    setChooser(false);
    const remaining = MAX_PHOTOS - total;
    if (remaining <= 0) return;
    const { uris, denied } = await pickDishPhotos(source, remaining);
    if (denied) {
      Alert.alert('Access needed', 'Allow photo or camera access in Settings to add a picture of your dish.');
      return;
    }
    uris.forEach(uploadOne);
  }

  function retry(id: string) {
    const item = staged.find(x => x.id === id);
    if (!item) return;
    setStaged(prev => prev.filter(x => x.id !== id));
    uploadOne(item.localUri);
  }

  function save() {
    const uploaded: PhotoRef[] = staged
      .filter(x => x.status === 'done' && x.url && x.publicId)
      .map(x => ({ url: x.url!, publicId: x.publicId! }));
    if (!uploaded.length) return;
    cook.attachUploadedPhotos(slug, resolveMakeId(), uploaded);
    setStaged([]);
    setSaved(true);
    success.setValue(0);
    Animated.timing(success, {
      toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(success, {
        toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start(() => setSaved(false));
    }, 1100);
  }

  const panelStyle = {
    opacity: enter,
    transform: reduceMotion ? [] : [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.panel, panelStyle]}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Photos of your dish</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={8} accessibilityLabel="Close">
              <IconClose size={sc(14)} color={pal.sub} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
            {total === 0 && (
              <Text style={s.empty}>Snap how yours turned out — your care team loves seeing it.</Text>
            )}

            {existing.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Saved</Text>
                <View style={s.grid}>
                  {existing.map(p => (
                    <View key={p.publicId} style={s.tile}>
                      <Image source={{ uri: cloudThumb(p.url, 240, 240) }} style={s.tileImg} />
                      <TouchableOpacity
                        style={s.tileX} hitSlop={6}
                        onPress={() => cook.removePhoto(slug, p.madeAt, { publicId: p.publicId })}
                        accessibilityLabel="Remove photo"
                      >
                        <IconClose size={sc(9)} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {staged.length > 0 && (
              <>
                <Text style={s.sectionLabel}>New</Text>
                <View style={s.grid}>
                  {staged.map(it => (
                    <View key={it.id} style={s.tile}>
                      <Image source={{ uri: it.localUri }} style={[s.tileImg, it.status !== 'done' && s.tileDim]} />
                      {it.status === 'uploading' && (
                        <View style={s.progressTrack}><View style={[s.progressFill, { width: `${it.progress}%` }]} /></View>
                      )}
                      {it.status === 'done' && (
                        <View style={s.doneBadge}><IconCheck size={sc(9)} color="#fff" /></View>
                      )}
                      {it.status === 'failed' && (
                        <TouchableOpacity style={s.retry} onPress={() => retry(it.id)}>
                          <Text style={s.retryTxt}>Retry</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={s.tileX} hitSlop={6}
                        onPress={() => setStaged(prev => prev.filter(x => x.id !== it.id))}
                        accessibilityLabel="Remove photo"
                      >
                        <IconClose size={sc(9)} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {total < MAX_PHOTOS && (
              <TouchableOpacity style={s.addTile} onPress={() => setChooser(true)} activeOpacity={0.8}>
                <Text style={s.addPlus}>＋</Text>
                <Text style={s.addLabel}>Add photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer — Save */}
          <View style={s.footer}>
            <TouchableOpacity
              style={[s.saveBtn, !canSave && s.saveBtnOff]}
              disabled={!canSave}
              onPress={save}
              activeOpacity={0.9}
            >
              {uploading > 0
                ? <View style={s.saveRow}><ActivityIndicator size="small" color={pal.onAccent} /><Text style={s.saveText}>Uploading {uploading}…</Text></View>
                : <Text style={s.saveText}>{done > 0 ? `Save ${done} photo${done > 1 ? 's' : ''}` : 'Save'}</Text>}
            </TouchableOpacity>
          </View>

          {/* Source chooser — in-panel overlay (no nested modal) */}
          {chooser && (
            <View style={s.chooserWrap}>
              <TouchableOpacity style={s.chooserScrim} onPress={() => setChooser(false)} activeOpacity={1} />
              <View style={s.chooserSheet}>
                <TouchableOpacity style={s.chooserBtn} onPress={() => pick('camera')}><Text style={s.chooserBtnTxt}>Take photo</Text></TouchableOpacity>
                <TouchableOpacity style={s.chooserBtn} onPress={() => pick('library')}><Text style={s.chooserBtnTxt}>Choose from library</Text></TouchableOpacity>
                <TouchableOpacity style={s.chooserCancel} onPress={() => setChooser(false)}><Text style={s.chooserCancelTxt}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {/* Success beat */}
          {saved && (
            <Animated.View
              pointerEvents="none"
              style={[
                s.successWrap,
                { opacity: success, transform: reduceMotion ? [] : [{ scale: success.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
              ]}
            >
              <View style={s.successCircle}><IconCheck size={sc(28)} color="#fff" /></View>
              <Text style={s.successText}>Saved</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (p: Pal) => scaledSheet({
  overlay: { flex: 1, backgroundColor: p.scrim, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: p.panel, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '86%', paddingBottom: 8, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10,
  },
  title: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: p.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingBottom: 16, gap: 6 },
  empty: { fontSize: 12.5, fontFamily: fonts.sans, color: p.sub, lineHeight: 18, paddingVertical: 6 },
  sectionLabel: {
    fontSize: 10, fontFamily: fonts.sans, fontWeight: '800', color: p.sub,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: 92, height: 92 },
  tileImg: { width: 92, height: 92, borderRadius: 12, backgroundColor: p.thumbBg },
  tileDim: { opacity: 0.6 },
  tileX: {
    position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(20,18,15,0.78)', alignItems: 'center', justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute', left: 8, right: 8, bottom: 8, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: p.accent, borderRadius: 2 },
  doneBadge: {
    position: 'absolute', bottom: 6, right: 6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center',
  },
  retry: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,18,15,0.4)', borderRadius: 12,
  },
  retryTxt: { color: '#fff', fontSize: 11, fontFamily: fonts.sans, fontWeight: '800' },
  addTile: {
    width: 92, height: 92, borderRadius: 12, borderWidth: 1, borderColor: p.line,
    borderStyle: 'dashed', backgroundColor: p.addBg, alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 8,
  },
  addPlus: { fontSize: 22, color: p.accent, fontWeight: '400', lineHeight: 24 },
  addLabel: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '700', color: p.accent },
  footer: { paddingHorizontal: 18, paddingTop: 8 },
  saveBtn: { backgroundColor: p.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnOff: { backgroundColor: p.line },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveText: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '800', color: p.onAccent },
  chooserWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  chooserScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  chooserSheet: { backgroundColor: p.panel, padding: 14, gap: 8, borderTopWidth: 1, borderColor: p.line },
  chooserBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: p.addBg, borderWidth: 1, borderColor: p.line },
  chooserBtnTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: p.text },
  chooserCancel: { alignItems: 'center', paddingVertical: 10 },
  chooserCancelTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: p.sub },
  successWrap: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: p.panel, gap: 10,
  },
  successCircle: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: p.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  successText: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: p.text },
});
