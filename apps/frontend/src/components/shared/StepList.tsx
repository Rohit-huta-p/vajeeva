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
        <View key={i} style={[s.row, i === steps.length - 1 && s.lastRow]}>
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
  row: {
    flexDirection: 'row', gap: 9, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: 'rgba(229,221,204,0.7)',
  },
  lastRow: { borderBottomWidth: 0 },
  circle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  num: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.green },
  body: { flex: 1 },
  phase: {
    fontSize: 8, fontFamily: fonts.sans, fontWeight: '800',
    color: colors.amber, letterSpacing: 0.5, marginBottom: 2,
  },
  text: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 16.5 },
});
