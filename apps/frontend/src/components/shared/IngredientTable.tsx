import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';

export interface Ingredient {
  name: string;
  amountG: number;
  amountCup?: string;
  stage?: string; // if set, this row is a stage header
}

export function IngredientTable({ ingredients, unit }: {
  ingredients: Ingredient[]; unit: 'g' | 'cup';
}) {
  let visibleIndex = 0;
  return (
    <View>
      {ingredients.map((ing, i) => {
        if (ing.stage) {
          return (
            <Text key={i} style={s.stage}>{ing.stage.toUpperCase()}</Text>
          );
        }
        const odd = visibleIndex % 2 === 0; // prototype: first row tinted (nth-child odd)
        visibleIndex += 1;
        const amount = unit === 'g' ? `${ing.amountG} g` : (ing.amountCup ?? `${ing.amountG} g`);
        return (
          <View key={i} style={[s.row, odd && s.odd]}>
            <Text style={s.name}>{ing.name}</Text>
            <Text style={s.amount}>{amount}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = scaledSheet({
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 14 },
  odd: { backgroundColor: 'rgba(233,225,208,0.45)' },
  stage: {
    fontSize: 8, fontFamily: fonts.sans, fontWeight: '800',
    color: colors.amber, letterSpacing: 0.6, paddingTop: 9, paddingBottom: 3, paddingHorizontal: 14,
  },
  name: { flex: 1, fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 14 },
  amount: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'right' },
});
