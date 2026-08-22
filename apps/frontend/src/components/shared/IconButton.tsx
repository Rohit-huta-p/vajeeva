import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export function IconButton({ icon, onPress, size = 34, style }: {
  icon: React.ReactNode; onPress: () => void; size?: number; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[s.btn, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={onPress}
    >
      {typeof icon === 'string' ? <Text style={s.icon}>{icon}</Text> : icon}
    </TouchableOpacity>
  );
}

const s = scaledSheet({
  btn: {
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line,
    ...shadows.card,
  },
  icon: { fontSize: 16, color: colors.ink },
});
