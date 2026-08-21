import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const CATEGORIES = ['all', 'solid', 'liquid', 'semi-solid'] as const;
export type Category = typeof CATEGORIES[number];

interface Props {
  selected: Category;
  onSelect: (c: Category) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
      {CATEGORIES.map(c => (
        <TouchableOpacity key={c} style={[s.pill, selected === c && s.active]} onPress={() => onSelect(c)}>
          <Text style={[s.label, selected === c && s.activeLabel]}>
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row:         { flexGrow: 0 },
  pill:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                 backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line },
  active:      { backgroundColor: colors.green, borderColor: colors.green },
  label:       { fontSize: 13, color: colors.ink2, fontWeight: '600' },
  activeLabel: { color: colors.cream },
});
