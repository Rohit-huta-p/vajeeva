import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconClose, IconCheck } from './icons';
import { GENDER_OPTIONS } from '../../config/gender';

export interface ProfileDraft { name: string; age?: number; gender?: string }

// Bottom-sheet to edit identity — name, age, gender (mirrors the signup step's
// fields). Same Modal / scrim grammar as the other sheets; drafts locally, only
// Save commits. Age is optional here but validated to the signup range (13–120)
// when entered; tapping the selected gender again clears it.
export function ProfileEditSheet({ visible, name, age, gender, onSave, onClose }: {
  visible: boolean;
  name: string;
  age?: number;
  gender?: string;
  onSave: (patch: ProfileDraft) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [nameDraft, setNameDraft] = useState(name);
  const [ageDraft, setAgeDraft] = useState(age ? String(age) : '');
  const [genderDraft, setGenderDraft] = useState<string | null>(gender ?? null);
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused] = useState(false);

  // Re-seed each time the sheet opens so a prior cancel never lingers.
  useEffect(() => {
    if (visible) {
      setNameDraft(name);
      setAgeDraft(age ? String(age) : '');
      setGenderDraft(gender ?? null);
    }
  }, [visible, name, age, gender]);

  const ageT = ageDraft.trim();
  const ageNum = parseInt(ageT, 10);
  const ageOk = ageT === '' || (/^\d+$/.test(ageT) && ageNum >= 13 && ageNum <= 120);
  const canSave = nameDraft.trim().length > 0 && ageOk;

  const save = () => {
    if (!canSave) return;
    onSave({
      name: nameDraft.trim(),
      age: ageT === '' ? undefined : ageNum,
      gender: genderDraft ?? undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <Text style={s.title}>Edit profile</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close} accessibilityLabel="Close">
              <IconClose size={sc(15)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            <Text style={s.label}>Name</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              style={[s.input, nameFocused && s.inputFocused]}
              autoFocus
              accessibilityLabel="Name"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />

            <Text style={s.label}>Age</Text>
            <TextInput
              value={ageDraft}
              onChangeText={setAgeDraft}
              placeholder="Your age"
              placeholderTextColor={colors.muted}
              style={[s.input, ageFocused && s.inputFocused]}
              keyboardType="number-pad"
              maxLength={3}
              accessibilityLabel="Age"
              onFocus={() => setAgeFocused(true)}
              onBlur={() => setAgeFocused(false)}
            />
            {!ageOk ? <Text style={s.err}>Enter an age between 13 and 120.</Text> : null}

            <Text style={s.label}>Gender</Text>
            <View style={s.pills}>
              {GENDER_OPTIONS.map(opt => {
                const on = genderDraft === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.pill, on && s.pillOn]}
                    onPress={() => setGenderDraft(on ? null : opt.value)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[s.pillTxt, on && s.pillTxtOn]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={s.foot}>
            <TouchableOpacity
              style={[s.cta, !canSave && s.ctaOff]}
              onPress={save}
              disabled={!canSave}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
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
  body: { paddingHorizontal: 16, paddingTop: 4 },
  label: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.72,
    textTransform: 'uppercase', color: colors.labelFaint, marginTop: 12, marginBottom: 5,
  },
  input: {
    backgroundColor: colors.bone, borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, fontFamily: fonts.sans, color: colors.ink,
  },
  inputFocused: {
    borderColor: colors.line,
  },
  err: { fontSize: 10, fontFamily: fonts.sans, color: colors.clay, marginTop: 5 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    borderWidth: 1, borderColor: colors.line2, backgroundColor: colors.bone,
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13,
  },
  pillOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  pillTxt: { fontSize: 11.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  pillTxtOn: { color: colors.green },
  foot: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 18 },
  cta: {
    backgroundColor: colors.green, borderRadius: 14, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.card,
  },
  ctaOff: { opacity: 0.5 },
  ctaTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
