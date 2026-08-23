import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { IconClose, IconCheck } from './icons';

export interface ChoiceOption<T extends string> { value: T; label: string; hint?: string }

// Generic single-choice bottom-sheet (Units today; Appearance / Text size later).
// Same Modal / scrim grammar as the other sheets; tapping an option commits
// immediately and closes — no separate Save for a one-tap pick.
export function ChoiceSheet<T extends string>({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: ChoiceOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close} accessibilityLabel="Close">
              <IconClose size={sc(15)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            {options.map(opt => {
              const on = opt.value === selected;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.opt, on && s.optOn]}
                  onPress={() => { onSelect(opt.value); onClose(); }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={opt.label}
                >
                  <View style={s.optText}>
                    <Text style={s.optLabel}>{opt.label}</Text>
                    {opt.hint ? <Text style={s.optHint}>{opt.hint}</Text> : null}
                  </View>
                  {on ? <IconCheck size={sc(16)} color={colors.green} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,37,30,0.34)' },
  panel: { backgroundColor: colors.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: colors.sand, alignSelf: 'center', marginTop: 10 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6,
  },
  title: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 22, gap: 8 },
  opt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bone, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14,
  },
  optOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  optText: { flex: 1, minWidth: 0 },
  optLabel: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  optHint: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, marginTop: 2 },
});
