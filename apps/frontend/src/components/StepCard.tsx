import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { Step } from '@vajeeva/shared';
import TimerPill from './TimerPill';
import { colors } from '../theme';

interface Props { step: Step; }

export default function StepCard({ step }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.stepText}>{step.text}</Text>

      {step.stepIngredients.length > 0 && (
        <View style={s.ingRow}>
          <Text style={s.ingLabel}>THIS STEP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}>
            {step.stepIngredients.map((ing, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText}>{ing}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={s.infoRow}>
        {step.heat && (
          <Text style={s.heat}>🔥 {step.heat}</Text>
        )}
        {step.timerStr && (
          <TimerPill timerStr={step.timerStr} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, gap: 14 },
  stepText:  { fontFamily: 'serif', fontSize: 20, fontWeight: '700', lineHeight: 30,
               color: colors.cmText, letterSpacing: -0.2 },
  ingRow:    { gap: 6 },
  ingLabel:  { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2, color: colors.cmMuted },
  chip:      { borderWidth: 1, borderColor: 'rgba(198,144,47,0.3)', borderRadius: 999,
               paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(198,144,47,0.07)' },
  chipText:  { fontSize: 10, color: colors.cmAmber },
  infoRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heat:      { fontSize: 11, color: colors.cmMuted, fontWeight: '700', fontFamily: 'mono' },
});
