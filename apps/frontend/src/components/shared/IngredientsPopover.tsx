import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { usePreferences } from '../../hooks/usePreferences';
import type { RecipeDoc } from '../../api/recipes';

type Ingredient = RecipeDoc['ingredients'][number];

// Mirrors IngredientTable's formatMetricAmount, kept separate rather than
// shared: this popover renders against Cook Mode's fixed dark palette
// (colors.cm*), not the app's light/dark ThemeContext the main table uses.
function formatAmount(ing: Ingredient, unit: 'g' | 'cup'): string {
  if (unit === 'cup') {
    const cup = ing.quantityCup?.trim();
    if (cup) return cup;
  }
  const ml = ing.quantityMl?.trim();
  if (ml) return `${ml} ml`;
  const g = ing.quantityG?.trim();
  if (g) return `${g} gm`;
  return '';
}

// A small anchored popover (not a bottom sheet) so cooking isn't interrupted:
// opens right under its trigger, reads once, dismisses on any outside tap.
export function IngredientsPopover({ visible, onClose, ingredients }: {
  visible: boolean; onClose: () => void; ingredients: Ingredient[];
}) {
  const { prefs } = usePreferences();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Dismiss">
        <SafeAreaView style={s.safe}>
          {/* Swallow the tap so it doesn't bubble to the scrim behind it. */}
          <Pressable style={s.panel} onPress={e => e.stopPropagation()}>
            <Text style={s.title}>Ingredients</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ingredients.map((ing, i) => {
                const amount = formatAmount(ing, prefs.units);
                const note = ing.note?.trim();
                return (
                  <View key={i} style={[s.row, i === ingredients.length - 1 && s.rowLast]}>
                    <Text style={s.name}>{ing.nameEn}</Text>
                    {amount ? <Text style={s.amount}>{amount}</Text> : null}
                    {note ? <Text style={s.note}>{note}</Text> : null}
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const s = scaledSheet({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  safe: { flex: 1 },
  // Anchored top-right, under the phase strip's trigger — not bottom-anchored
  // like the app's other sheets, so it reads as a quick glance, not a detour.
  panel: {
    position: 'absolute', top: 52, right: 14, width: 220, maxHeight: '55%',
    backgroundColor: colors.cmSurf2, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cmLine,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  title: {
    fontSize: 9.5, fontFamily: fonts.mono, fontWeight: '700', color: colors.cmAmber,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  row: { paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.cmLine },
  rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  name: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.cmText },
  amount: { fontSize: 10, fontFamily: fonts.mono, color: colors.cmMuted, marginTop: 2 },
  note: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: 'italic', color: colors.cmMuted, marginTop: 2 },
});
