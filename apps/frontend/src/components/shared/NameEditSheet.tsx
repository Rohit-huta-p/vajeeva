import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconClose, IconCheck } from './icons';

// Small bottom-sheet to edit the display name (Profile › identity edit). Same
// Modal / scrim grammar as HealthProfileSheet; drafts locally, Save commits.
export function NameEditSheet({ visible, name, onSave, onClose }: {
  visible: boolean; name: string; onSave: (name: string) => void; onClose: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [draft, setDraft] = useState(name);
  useEffect(() => { if (visible) setDraft(name); }, [visible, name]);

  const save = () => { onSave(draft.trim()); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>Your name</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close} accessibilityLabel="Close">
              <IconClose size={sc(15)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              style={s.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={save}
              accessibilityLabel="Name"
            />
          </View>
          <View style={s.foot}>
            <TouchableOpacity style={s.cta} onPress={save} activeOpacity={0.85} accessibilityRole="button">
              <IconCheck size={sc(15)} color={colors.onGreen} />
              <Text style={s.ctaTxt}>Save</Text>
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
  panel: { backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.sand, alignSelf: 'center', marginTop: 10 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6,
  },
  title: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 6 },
  input: {
    backgroundColor: colors.bone, borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: fonts.sans, color: colors.ink,
  },
  foot: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18 },
  cta: {
    backgroundColor: colors.green, borderRadius: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.card,
  },
  ctaTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
