import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';

export function CTA({ label, onPress, icon }: {
  label: string; onPress: () => void; icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.85}>
      <View style={s.row}>
        {icon == null ? null : typeof icon === 'string' ? <Text style={s.iconText}>{icon}</Text> : icon}
        <Text style={s.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 15, alignItems: 'center',
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconText: { fontSize: 15, color: colors.onGreen },
  label: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
