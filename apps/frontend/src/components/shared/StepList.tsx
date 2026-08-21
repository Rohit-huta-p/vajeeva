import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export interface Step {
  phase?: string;
  text: string;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <View>
      {steps.map((step, i) => (
        <View key={i} style={s.row}>
          <View style={s.circle}>
            <Text style={s.num}>{i + 1}</Text>
          </View>
          <View style={s.body}>
            {step.phase ? <Text style={s.phase}>{step.phase.toUpperCase()}</Text> : null}
            <Text style={s.text}>{step.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 16 },
  circle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 2, flexShrink: 0,
  },
  num: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.onGreen },
  body: { flex: 1 },
  phase: {
    fontSize: 8, fontFamily: fonts.mono, fontWeight: '700',
    color: colors.amber, letterSpacing: 0.08, marginBottom: 4,
  },
  text: { fontSize: 13, fontFamily: fonts.sans, color: colors.ink, lineHeight: 18 },
});
