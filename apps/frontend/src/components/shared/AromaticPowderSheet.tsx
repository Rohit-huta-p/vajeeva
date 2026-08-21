import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

// Prototype bottom sheet (.bsoverlay/.bspanel) for the shared sub-recipe.
// TODO(API-SUBRECIPE): content below is the prototype's own copy, kept as
// placeholder — the API has no consumer sub-recipe endpoint and SubRecipe only
// stores {name, slug, usedIn} (no note/ingredients/method). Flagged to god.
const SHEET = {
  title: 'Aromatic Powder Blend',
  subtitle: 'Shared sub-recipe · used in 8 recipes',
  note: 'Make in a small batch. Grind together fine. Store airtight, away from light — keeps up to 1 month. Use ¼–½ tsp per recipe.',
  rows: [
    ['Cardamom pods', '3–4'],
    ['Cloves', '2–3'],
    ['Black pepper', '2–3'],
    ['Cinnamon', '2–3 inch'],
    ['Dry ginger', '2–3 inch'],
    ['Edible camphor', '2–3 crystals'],
  ] as const,
  method: 'Grind all ingredients together to a fine powder. Cardamom and cloves go in last to preserve volatile oils. Do not over-grind.',
};

export function AromaticPowderSheet({ visible, onClose }: {
  visible: boolean; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onClose} />
        <View style={s.panel}>
          <View style={s.handle} />
          <View style={s.head}>
            <View style={s.headText}>
              <Text style={s.title}>{SHEET.title}</Text>
              <Text style={s.subtitle}>{SHEET.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.bodyContent}>
            <Text style={s.note}>{SHEET.note}</Text>
            {SHEET.rows.map(([name, qty], i) => (
              <View key={name} style={[s.row, i % 2 === 0 && s.odd]}>
                <Text style={s.rowName}>{name}</Text>
                <Text style={s.rowQty}>{qty}</Text>
              </View>
            ))}
            <Text style={s.method}>{SHEET.method}</Text>
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
  close: { fontSize: 17, color: colors.ink2, padding: 2, lineHeight: 18 },
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
