import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { subrecipesApi } from '../../api';
import { IconClose } from './icons';

// Prototype bottom sheet (.bsoverlay/.bspanel) for the shared sub-recipe.
// Content is fetched from GET /api/subrecipes/:slug; the S-24 sourced copy
// (content/vajeeva-recipes.md) stays as the offline/error fallback so the
// sheet never renders empty. usedIn always comes from the API — omitted when
// unknown, never hardcoded.
const SLUG = 'aromatic-powder-blend';

interface SubRecipeSheet {
  title: string;
  usedIn: number | null;
  note: string;
  rows: readonly (readonly [string, string])[];
  method: string;
}

const FALLBACK: SubRecipeSheet = {
  title: 'Aromatic Powder Blend',
  usedIn: null,
  note: 'Make in a small batch. Grind together fine. Store airtight, away from light — keeps up to 1 month. Use ¼–½ tsp per recipe.',
  rows: [
    ['Cardamom pods', '3–4'],
    ['Cloves', '2–3'],
    ['Black pepper', '2–3'],
    ['Cinnamon', '2–3 inch'],
    ['Dry ginger', '2–3 inch'],
    ['Edible camphor', '2–3 crystals'],
  ],
  method: 'Grind all ingredients together to a fine powder. Cardamom and cloves go in last to preserve volatile oils. Do not over-grind.',
};

export function AromaticPowderSheet({ visible, onClose }: {
  visible: boolean; onClose: () => void;
}) {
  const [sheet, setSheet] = useState<SubRecipeSheet>(FALLBACK);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    subrecipesApi.detail(SLUG).then((data: any) => {
      if (!alive || !data) return;
      setSheet(prev => ({
        ...prev,
        title: typeof data.name === 'string' ? data.name : prev.title,
        usedIn: typeof data.usedIn === 'number' ? data.usedIn : prev.usedIn,
        note: typeof data.note === 'string' ? data.note : prev.note,
        method: typeof data.method === 'string' ? data.method : prev.method,
        rows: Array.isArray(data.ingredients) && data.ingredients.length
          ? data.ingredients.map((ing: any) => [ing.name ?? '', ing.qty ?? ''] as const)
          : prev.rows,
      }));
    }).catch(() => { /* offline — sourced fallback stands */ });
    return () => { alive = false; };
  }, [visible]);

  const subtitle = sheet.usedIn != null
    ? `Shared sub-recipe · used in ${sheet.usedIn} ${sheet.usedIn === 1 ? 'recipe' : 'recipes'}`
    : 'Shared sub-recipe';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <View style={s.headText}>
              <Text style={s.title}>{sheet.title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={s.close}>
              <IconClose size={15} color={colors.ink2} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.bodyContent}>
            <Text style={s.note}>{sheet.note}</Text>
            {sheet.rows.map(([name, qty], i) => (
              <View key={name} style={[s.row, i % 2 === 0 && s.odd]}>
                <Text style={s.rowName}>{name}</Text>
                <Text style={s.rowQty}>{qty}</Text>
              </View>
            ))}
            <Text style={s.method}>{sheet.method}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,37,30,0.3)' },
  panel: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    maxHeight: '78%',
  },
  handle: {
    width: 34, height: 4, borderRadius: 2,
    backgroundColor: colors.sand, alignSelf: 'center', marginTop: 10,
  },
  head: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 14, paddingBottom: 6,
  },
  headText: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 10, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 2 },
  close: { padding: 2 },
  bodyContent: { paddingBottom: 20 },
  note: {
    fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, lineHeight: 15,
    paddingTop: 4, paddingHorizontal: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 4,
  },
  row: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 14 },
  odd: { backgroundColor: 'rgba(233,225,208,0.4)' },
  rowName: { flex: 1, fontSize: 11, fontFamily: fonts.sans, color: colors.ink },
  rowQty: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'right' },
  method: {
    fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, lineHeight: 16,
    paddingVertical: 10, paddingHorizontal: 14, marginTop: 4,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
});
