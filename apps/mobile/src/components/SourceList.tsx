import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Source } from '@vajeeva/shared';
import { colors } from '../theme';

export default function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <View style={s.root}>
      <Text style={s.heading}>Classical Sources</Text>
      {sources.map((src, i) => (
        <View key={i} style={s.row}>
          <Text style={s.text}>{src.text}</Text>
          {src.citation ? <Text style={s.citation}>{src.citation}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root:     { gap: 8 },
  heading:  { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  row:      { backgroundColor: colors.amberSoft, borderRadius: 10, padding: 12, gap: 4 },
  text:     { fontSize: 13, color: colors.ink, fontStyle: 'italic' },
  citation: { fontSize: 11, color: colors.amber2, fontWeight: '700' },
});
