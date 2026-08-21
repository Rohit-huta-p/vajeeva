import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export function CTA({ label, onPress, icon }: {
  label: string; onPress: () => void; icon?: string;
}) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.85}>
      <View style={s.row}>
        {icon ? <Text style={s.icon}>{icon}</Text> : null}
        <Text style={s.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16, color: colors.onGreen },
  label: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
