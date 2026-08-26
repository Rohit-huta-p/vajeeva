import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconClose, IconCheck } from './icons';
import { HealthFlagGrid } from './HealthFlagGrid';
import { useHealthFlags } from '../../hooks/useHealthFlags';

// Bottom-sheet editor for the health profile (Settings › Edit). Same Modal /
// scrim grammar as AromaticPowderSheet. Holds a local draft seeded from `codes`;
// only "Save profile" commits — scrim tap, the X, and Android back all cancel
// (onRequestClose), leaving the stored profile untouched.
export function HealthProfileSheet({ visible, codes, onSave, onClose }: {
  visible: boolean;
  codes: string[];
  onSave: (codes: string[]) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const flags = useHealthFlags();
  const [draft, setDraft] = useState<Set<string>>(() => new Set(codes));

  // Re-seed each time the sheet opens so a prior cancel never lingers.
  useEffect(() => { if (visible) setDraft(new Set(codes)); }, [visible, codes]);

  const toggle = (code: string) =>
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });

  const save = () => { onSave([...draft]); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <View style={s.headText}>
              <Text style={s.title}>Health profile</Text>
              <Text style={s.sub}>Recipes that need care get a flag; “Safe for me” hides them.</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close} accessibilityLabel="Close">
              <IconClose size={sc(15)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
            <HealthFlagGrid flags={flags} selected={draft} onToggle={toggle} />
          </ScrollView>
          <View style={s.foot}>
            <TouchableOpacity style={s.cta} onPress={save} activeOpacity={0.85} accessibilityRole="button">
              <IconCheck size={sc(15)} color={colors.onGreen} />
              <Text style={s.ctaTxt}>Save profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '84%',
  },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.sand, alignSelf: 'center', marginTop: 10 },
  head: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6,
  },
  headText: { flex: 1, minWidth: 0, paddingRight: 10 },
  title: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2, marginTop: 3, lineHeight: 15 },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },
  foot: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 18 },
  cta: {
    backgroundColor: colors.green, borderRadius: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.card,
  },
  ctaTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
