import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { IconChev, CategoryIll, categoryTint } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

export function TexturePillar({ name, subtitle, count, category, onPress }: {
  name: string; subtitle: string; count: number; category: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={[s.tile, { backgroundColor: categoryTint(category) }]}>
        <CategoryIll category={category} size={sc(48)} />
      </View>
      <View style={s.info}>
        <Text style={s.name}>{name}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <Text style={s.count}>{count} recipes</Text>
      </View>
      <IconChev size={sc(18)} color={colors.muted} />
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cream, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    paddingVertical: 10, paddingHorizontal: 12,
    ...shadows.card,
  },
  tile: {
    width: 54, height: 54, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, marginTop: 1 },
  count: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, marginTop: 2 },
});
