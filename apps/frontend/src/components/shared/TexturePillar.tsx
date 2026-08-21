import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from '../../theme/tokens';

export function TexturePillar({ name, subtitle, count, onPress }: {
  name: string; subtitle: string; count: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{name}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <Text style={s.count}>{count} recipes</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cream, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    padding: spacing.md, marginBottom: 10,
    ...shadows.card,
  },
  tile: { width: 54, height: 54, borderRadius: 12, backgroundColor: colors.amberSoft, marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, marginTop: 2 },
  count: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, marginTop: 3 },
  chevron: { fontSize: 18, color: colors.muted, opacity: 0.5 },
});
