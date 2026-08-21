import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function OfflineBadge() {
  return (
    <View style={s.pill}>
      <Text style={s.icon}>🌿</Text>
      <Text style={s.label}>Offline</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.sand, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  icon: { fontSize: 10 },
  label: { fontSize: 9.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
});
