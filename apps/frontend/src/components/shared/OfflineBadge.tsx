import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { IconLeaf } from './icons';

export function OfflineBadge() {
  return (
    <View style={s.pill}>
      <IconLeaf size={11} color={colors.green} />
      <Text style={s.label}>Offline</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.sand, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  label: { fontSize: 9.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
});
