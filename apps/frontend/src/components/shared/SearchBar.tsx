import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';

export function SearchBar({ placeholder = 'Search recipes…', value, onChangeText }: {
  placeholder?: string; value: string; onChangeText: (t: string) => void;
}) {
  return (
    <View style={s.bar}>
      <Text style={s.icon}>🔍</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.cream, borderRadius: 99,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 12, paddingVertical: 9,
    ...shadows.card,
  },
  icon: { fontSize: 13, opacity: 0.5 },
  input: { flex: 1, fontSize: 11.5, fontFamily: fonts.sans, color: colors.ink },
});
