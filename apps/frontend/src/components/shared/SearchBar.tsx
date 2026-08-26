import React from 'react';
import { View, TextInput } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconSearch } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

export function SearchBar({ placeholder = 'Search a recipe or ingredient…', value, onChangeText, onSubmit }: {
  placeholder?: string; value: string; onChangeText: (t: string) => void;
  /** Fired on the keyboard's search/return key — e.g. navigate to results. */
  onSubmit?: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.bar}>
      <IconSearch size={sc(15)} color={colors.muted} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: colors.cream, borderRadius: 999,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 14, paddingVertical: 11,
    ...shadows.card,
  },
  input: { flex: 1, fontSize: 11.5, fontFamily: fonts.sans, color: colors.ink, padding: 0 },
});
