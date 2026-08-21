import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '../../theme/tokens';

export function IconButton({ icon, onPress, size = 34, style }: {
  icon: string; onPress: () => void; size?: number; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[s.btn, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={onPress}
    >
      <Text style={s.icon}>{icon}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  icon: { fontSize: 16, color: colors.ink },
});
