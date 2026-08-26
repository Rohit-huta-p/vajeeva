import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const s = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={s.btn} onPress={onPress}>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  btn: { alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 14, fontFamily: fonts.sans, color: colors.ink2 },
});
