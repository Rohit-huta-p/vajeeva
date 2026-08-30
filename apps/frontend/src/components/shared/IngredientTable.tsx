import React from 'react';
import { View, Text } from 'react-native';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet } from '../../theme/scale';
import { useThemedStyles } from '../../theme/ThemeContext';

export interface Ingredient {
  name: string;
  quantityG?: string;
  quantityMl?: string;
  quantityCup?: string;
  note?: string;
  stage?: string; // if set, this row is a stage header
}

// ml wins when present (the two are mutually exclusive in practice — every
// ingredient is measured one way or the other, never both); '—' means this
// row carries no quantity at all and relies on its `note` instead.
function formatMetricAmount(ing: Ingredient): string {
  const ml = ing.quantityMl?.trim();
  if (ml) return `${ml} ml`;
  const g = ing.quantityG?.trim();
  if (g) return `${g} gm`;
  return '—';
}

// Mirrors the server-side detection in
// vajeeva/apps/api/src/scripts/seed-subrecipes.ts (computeUsedIn) — keep the
// two in sync if this ever changes.
const AROMATIC_POWDER_RE = /aromatic powder/i;

export function IngredientTable({ ingredients, unit, onAromaticPowderPress }: {
  ingredients: Ingredient[]; unit: 'g' | 'cup'; onAromaticPowderPress?: () => void;
}) {
  const s = useThemedStyles(makeStyles);
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
        // '||' (not '??') because quantityCup is often present-but-"" rather
        // than absent — falls through to the metric amount either way.
        const amount = unit === 'cup'
          ? (ing.quantityCup?.trim() || formatMetricAmount(ing))
          : formatMetricAmount(ing);
        const note = ing.note?.trim();
        const isAromaticPowder = AROMATIC_POWDER_RE.test(ing.name);
        return (
          <View key={i} style={[s.row, odd && s.odd]}>
            <View style={s.nameCol}>
              <Text
                style={s.name}
                onPress={isAromaticPowder ? () => onAromaticPowderPress?.() : undefined}
              >
                {ing.name}
                {isAromaticPowder ? <Text style={s.nameExt}> ↗</Text> : null}
              </Text>
              {note ? <Text style={s.note}>{note}</Text> : null}
            </View>
            <Text style={amount === '—' ? s.amountEmpty : s.amount}>{amount}</Text>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  // flex-start (not the RN default stretch) keeps the amount aligned with the
  // ingredient name rather than centered, now that a note can make the name
  // column two lines tall.
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, paddingHorizontal: 14 },
  odd: { backgroundColor: colors.rowAlt },
  stage: {
    fontSize: 8, fontFamily: fonts.sans, fontWeight: '800',
    color: colors.amber, letterSpacing: 0.6, paddingTop: 9, paddingBottom: 3, paddingHorizontal: 14,
  },
  nameCol: { flex: 1 },
  name: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 14 },
  // Explicit amber — unlike the old footnote glyph, this one doesn't inherit
  // it from an amber-colored parent, since the ingredient name stays plain ink.
  nameExt: { fontSize: 8, opacity: 0.7, fontStyle: 'normal', fontFamily: fonts.sans, color: colors.amber },
  // Small pill, not inline text — keeps the note visually distinct from the
  // amount column instead of reading as one run-on phrase. alignSelf keeps it
  // sized to its content (nameCol's default 'stretch' would otherwise widen
  // it to the full column). line2 (not sand) deliberately: sand is a flat hex
  // that's nearly indistinguishable from this table's own row/rowAlt
  // backgrounds in dark mode (both sit close to `bone`), so the pill all but
  // disappeared on striped rows; line2 is a translucent overlay in dark mode,
  // so it adds visible contrast on top of whatever's beneath it either way.
  // Italic keeps this app's established "aside" pairing (Tamil name,
  // AromaticPowderSheet's note).
  note: {
    alignSelf: 'flex-start', marginTop: 3,
    backgroundColor: colors.line2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    fontSize: 9.5, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.ink2,
  },
  amount: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'right' },
  // Deliberately quieter than `amount` — a dash reads as "nothing to show
  // here, on purpose" rather than a blank cell that looks broken.
  amountEmpty: { fontSize: 11, fontFamily: fonts.sans, color: colors.muted, textAlign: 'right' },
});
