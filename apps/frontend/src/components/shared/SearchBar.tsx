import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { IconSearch } from './icons';

export function SearchBar({ placeholder = 'Search a recipe or ingredient…', value, onChangeText }: {
  placeholder?: string; value: string; onChangeText: (t: string) => void;
}) {
  return (
    <View style={s.bar}>
      <IconSearch size={15} color={colors.muted} />
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
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.cream, borderRadius: 999,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 14, paddingVertical: 11,
    ...shadows.card,
  },
  input: { flex: 1, fontSize: 11.5, fontFamily: fonts.sans, color: colors.ink, padding: 0 },
});
