import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export function CTA({ label, onPress, icon }: {
  label: string; onPress: () => void; icon?: React.ReactNode;
}) {
  const s = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.85}>
      <View style={s.row}>
        {icon == null ? null : typeof icon === 'string' ? <Text style={s.iconText}>{icon}</Text> : icon}
        <Text style={s.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  btn: {
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 15, alignItems: 'center',
    ...shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconText: { fontSize: 15, color: colors.onGreen },
  label: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
