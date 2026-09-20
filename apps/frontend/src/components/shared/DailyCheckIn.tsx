import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import type { Adherence } from '../../hooks/useDiary';

const OPTIONS: { v: Adherence; label: string }[] = [
  { v: 'followed', label: 'Followed' },
  { v: 'partial', label: 'Partly' },
  { v: 'deviated', label: 'Off plan' },
];
const CTA_TEXT = '#0c1a10';

// The daily dietary check-in — a light "did you stick to your plan today?" with a
// reason when they didn't. Cook-mode (dark) themed for the finish screen.
// See docs/specs/2026-09-20-dietary-diary.md §5.
export function DailyCheckIn({ onSubmit }: { onSubmit: (adherence: Adherence, remarks?: string) => void }) {
  const [choice, setChoice] = useState<Adherence | null>(null);
  const [remarks, setRemarks] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <View style={s.card}>
        <Text style={s.doneMsg}>✓ Noted for today — thank you</Text>
      </View>
    );
  }

  const save = () => {
    if (!choice) return;
    onSubmit(choice, remarks.trim() || undefined);
    setDone(true);
  };

  return (
    <View style={s.card}>
      <Text style={s.header}>Stick to your plan today?</Text>
      <View style={s.opts}>
        {OPTIONS.map(o => {
          const on = choice === o.v;
          return (
            <TouchableOpacity key={o.v} style={[s.opt, on && s.optOn]} onPress={() => setChoice(o.v)} activeOpacity={0.85}>
              <Text style={[s.optTxt, on && s.optTxtOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {choice && choice !== 'followed' && (
        <TextInput
          style={s.reason}
          placeholder="What got in the way? (optional)"
          placeholderTextColor={colors.cmMuted}
          value={remarks}
          onChangeText={setRemarks}
          multiline
        />
      )}
      {choice && (
        <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.9}>
          <Text style={s.saveTxt}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = scaledSheet({
  card: {
    alignSelf: 'stretch', backgroundColor: 'rgba(240,234,216,0.04)',
    borderWidth: 1, borderColor: 'rgba(240,234,216,0.1)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 10,
  },
  header: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.cmText },
  opts: { flexDirection: 'row', gap: 8 },
  opt: {
    flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11,
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine,
  },
  optOn: { backgroundColor: 'rgba(92,173,120,0.14)', borderColor: colors.cmGreen },
  optTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmMuted },
  optTxtOn: { color: colors.cmGreen },
  reason: {
    backgroundColor: colors.cmSurf, borderWidth: 1, borderColor: colors.cmLine, borderRadius: 11,
    padding: 10, fontSize: 12, fontFamily: fonts.sans, color: colors.cmText, minHeight: 42,
  },
  saveBtn: { backgroundColor: colors.cmGreen, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  saveTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: CTA_TEXT },
  doneMsg: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmGreen, textAlign: 'center', paddingVertical: 4 },
});
