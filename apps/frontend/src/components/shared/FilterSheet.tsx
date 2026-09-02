import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconCheck } from './icons';
import { scaledSheet, sc } from '../../theme/scale';
import { FILTER_GROUPS, groupLabel, type FilterPill } from '../../config/facets';

/**
 * Bottom-sheet filter panel for the recipe list's FILTER button. Shows the same
 * admin-owned pills as Home, grouped (effort / taste / occasion). Single-select
 * over the `filter` axis: tapping a chip reports it (or null to clear) via
 * onSelect. See docs/specs/2026-09-02-home-filter-pills.md.
 */
export function FilterSheet({ visible, pills, selected, onSelect, onClose }: {
  visible: boolean;
  pills: FilterPill[];
  selected?: string;
  onSelect: (code: string | null) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const groups = FILTER_GROUPS.filter(g => pills.some(p => p.group === g));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={[s.sheet, { paddingBottom: sc(16) + insets.bottom }]} onPress={() => {}}>
          <View style={s.grip} />
          <View style={s.head}>
            <Text style={s.title}>Filter</Text>
            {selected ? (
              <TouchableOpacity onPress={() => onSelect(null)} hitSlop={8}>
                <Text style={s.clear}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={s.body} contentContainerStyle={s.bodyContent}>
            {groups.map(g => (
              <View key={g} style={s.group}>
                <Text style={s.groupLabel}>{groupLabel(g)}</Text>
                <View style={s.chips}>
                  {pills.filter(p => p.group === g).map(p => {
                    const on = selected === p.code;
                    return (
                      <TouchableOpacity
                        key={p.code}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => onSelect(on ? null : p.code)}
                        activeOpacity={0.7}
                      >
                        {on ? <IconCheck size={sc(11)} color={colors.green} /> : null}
                        <Text style={[s.chipLabel, on && s.chipLabelOn]}>{p.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  backdrop: { flex: 1, backgroundColor: 'rgba(23,20,16,0.38)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 9, maxHeight: '80%',
    ...shadows.card,
  },
  grip: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line2, alignSelf: 'center', marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 17, lineHeight: 22, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  clear: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.green },
  body: { flexGrow: 0 },
  bodyContent: { paddingBottom: 4 },
  group: { marginTop: 12 },
  groupLabel: {
    fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
    fontFamily: fonts.mono, color: colors.muted, marginBottom: 8, marginLeft: 2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: colors.line2, backgroundColor: colors.cream,
  },
  chipOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  chipLabel: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  chipLabelOn: { color: colors.green },
});
