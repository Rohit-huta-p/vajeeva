import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { HealthFlag } from '@vajeeva/shared';
import { colors } from '../theme';

const severityColor: Record<string, string> = {
  safe:    colors.green,
  caution: colors.amber,
  avoid:   colors.clay,
};

export default function HealthFlagList({ flags }: { flags: HealthFlag[] }) {
  if (!flags.length) return null;
  return (
    <View style={s.root}>
      <Text style={s.heading}>Health Flags</Text>
      {flags.map((f, i) => (
        <View key={i} style={[s.row, { borderLeftColor: severityColor[f.severity] ?? colors.muted }]}>
          <Text style={s.condition}>{f.condition}</Text>
          <Text style={[s.badge, { color: severityColor[f.severity] ?? colors.muted }]}>{f.severity}</Text>
          {f.note ? <Text style={s.note}>{f.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root:      { gap: 8 },
  heading:   { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  row:       { borderLeftWidth: 3, paddingLeft: 10, gap: 2 },
  condition: { fontSize: 14, fontWeight: '600', color: colors.ink },
  badge:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  note:      { fontSize: 12, color: colors.ink2 },
});
