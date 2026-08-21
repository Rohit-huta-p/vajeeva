import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Ingredient } from '@vajeeva/shared';
import { colors } from '../theme';

export default function IngredientTable({ ingredients }: { ingredients: Ingredient[] }) {
  const [unit, setUnit] = useState<'g' | 'cup'>('cup');
  return (
    <View>
      <View style={s.toggle}>
        {(['cup', 'g'] as const).map(u => (
          <TouchableOpacity key={u} style={[s.toggleBtn, unit === u && s.active]} onPress={() => setUnit(u)}>
            <Text style={[s.toggleLabel, unit === u && s.activeLabel]}>{u === 'cup' ? 'Cup' : 'Grams'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.table}>
        <View style={[s.row, s.header]}>
          <Text style={[s.cell, s.head, { flex: 2 }]}>Ingredient</Text>
          <Text style={[s.cell, s.head]}>Amount</Text>
        </View>
        {ingredients.map((ing, i) => (
          <View key={i} style={[s.row, i % 2 === 0 && s.even]}>
            <Text style={[s.cell, { flex: 2 }]}>{ing.nameEn}</Text>
            <Text style={s.cell}>{unit === 'cup' ? ing.quantityCup : ing.quantityG}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  toggle:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  toggleBtn:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                 backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line },
  active:      { backgroundColor: colors.green, borderColor: colors.green },
  toggleLabel: { fontSize: 12, color: colors.ink2, fontWeight: '600' },
  activeLabel: { color: colors.cream },
  table:       { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  row:         { flexDirection: 'row', padding: 10 },
  header:      { backgroundColor: colors.sand },
  even:        { backgroundColor: colors.cream },
  cell:        { flex: 1, fontSize: 13, color: colors.ink },
  head:        { fontWeight: '700', color: colors.ink2 },
});
