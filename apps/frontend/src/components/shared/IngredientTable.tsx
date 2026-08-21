import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export interface Ingredient {
  name: string;
  amountG: number;
  amountCup?: string;
  stage?: string; // if set, this row is a stage header
}

export function IngredientTable({ ingredients, unit }: {
  ingredients: Ingredient[]; unit: 'g' | 'cup';
}) {
  return (
    <View>
      {ingredients.map((ing, i) => {
        if (ing.stage) {
          return (
            <Text key={i} style={s.stage}>{ing.stage.toUpperCase()}</Text>
          );
        }
        const amount = unit === 'g' ? `${ing.amountG}g` : (ing.amountCup ?? `${ing.amountG}g`);
        return (
          <View key={i} style={[s.row, i % 2 === 1 && s.odd]}>
            <Text style={s.name}>{ing.name}</Text>
            <Text style={s.amount}>{amount}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8 },
  odd: { backgroundColor: `${colors.sand}73` }, // 45% tint
  stage: {
    fontSize: 8, fontFamily: fonts.mono, fontWeight: '700',
    color: colors.amber, letterSpacing: 0.1, paddingVertical: 6, paddingHorizontal: 8,
  },
  name: { flex: 1, fontSize: 11, fontFamily: fonts.sans, color: colors.ink },
  amount: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2 },
});
