import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconChev } from './icons';
import { scaledSheet, sc } from '../../theme/scale';
import { FILTER_GROUPS, groupLabel, type FilterGroup, type FilterPill } from '../../config/facets';

/**
 * The Home quick-filter row. `effort` pills render flat (one-tap → filtered
 * list); the other groups (taste, occasion) collapse into labelled pills that
 * open a bottom sheet of options. A pick navigates via onSelect(code).
 * See docs/specs/2026-09-02-home-filter-pills.md.
 */
export function FilterPillRow({ pills, onSelect }: {
  pills: FilterPill[];
  onSelect: (code: string) => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [openGroup, setOpenGroup] = useState<FilterGroup | null>(null);

  const effort = pills.filter(p => p.group === 'effort');
  const menuGroups = FILTER_GROUPS.filter(g => g !== 'effort' && pills.some(p => p.group === g));
  const openPills = openGroup ? pills.filter(p => p.group === openGroup) : [];

  const pick = (code: string) => { setOpenGroup(null); onSelect(code); };

  if (effort.length === 0 && menuGroups.length === 0) return null;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.row}
        contentContainerStyle={s.rowContent}
      >
        {effort.map(p => (
          <TouchableOpacity key={p.code} style={s.pill} onPress={() => onSelect(p.code)} activeOpacity={0.7}>
            <Text style={s.pillLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
        {menuGroups.map(g => (
          <TouchableOpacity
            key={g}
            style={[s.pill, openGroup === g && s.pillOpen]}
            onPress={() => setOpenGroup(g)}
            activeOpacity={0.7}
          >
            <Text style={[s.pillLabel, openGroup === g && s.pillLabelOpen]}>{groupLabel(g)}</Text>
            <View style={s.chev}><IconChev size={sc(9)} color={openGroup === g ? colors.green : colors.ink2} /></View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={openGroup !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenGroup(null)}
      >
        <Pressable style={s.backdrop} onPress={() => setOpenGroup(null)}>
          {/* Stop propagation so taps inside the sheet don't dismiss it. */}
          <Pressable style={[s.sheet, { paddingBottom: sc(10) + insets.bottom }]} onPress={() => {}}>
            <View style={s.grip} />
            <Text style={s.sheetTitle}>{openGroup ? groupLabel(openGroup) : ''}</Text>
            {openPills.map(p => (
              <TouchableOpacity key={p.code} style={s.optRow} onPress={() => pick(p.code)} activeOpacity={0.6}>
                <Text style={s.optLabel}>{p.label}</Text>
                <IconChev size={sc(12)} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  row: { flexGrow: 0 },
  rowContent: { gap: 7, paddingRight: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1.5, borderColor: colors.line2, backgroundColor: colors.cream,
  },
  pillOpen: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  pillLabel: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  pillLabelOpen: { color: colors.green },
  // Right-chevron rotated to a down-caret to read as a dropdown affordance.
  chev: { transform: [{ rotate: '90deg' }] },

  backdrop: { flex: 1, backgroundColor: 'rgba(23,20,16,0.38)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 9,
    ...shadows.card,
  },
  grip: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line2, alignSelf: 'center', marginBottom: 10 },
  sheetTitle: {
    fontSize: 15, lineHeight: 20, fontFamily: fonts.serif, fontWeight: '700',
    color: colors.ink, marginBottom: 2, marginLeft: 2,
  },
  optRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.line,
  },
  optLabel: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '600', color: colors.ink },
});
