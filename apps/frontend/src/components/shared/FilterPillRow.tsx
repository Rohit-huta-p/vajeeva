import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, useWindowDimensions } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconChev } from './icons';
import { scaledSheet, sc } from '../../theme/scale';
import { FILTER_GROUPS, groupLabel, type FilterGroup, type FilterPill } from '../../config/facets';

/**
 * The Home quick-filter row. `effort` pills render flat (one-tap → filtered
 * list); the other groups (taste, occasion) collapse into labelled pills that
 * open a dropdown menu anchored under the pill. A pick navigates via
 * onSelect(code). See docs/specs/2026-09-02-home-filter-pills.md.
 */
export function FilterPillRow({ pills, onSelect }: {
  pills: FilterPill[];
  onSelect: (code: string) => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { width: screenW } = useWindowDimensions();
  const menuW = sc(170);
  // measureInWindow node handles for the dropdown-pill anchors.
  const anchors = useRef<Record<string, any>>({});
  const [menu, setMenu] = useState<{ group: FilterGroup; left: number; top: number } | null>(null);

  const effort = pills.filter(p => p.group === 'effort');
  const menuGroups = FILTER_GROUPS.filter(g => g !== 'effort' && pills.some(p => p.group === g));
  const openPills = menu ? pills.filter(p => p.group === menu.group) : [];

  const open = (g: FilterGroup) => {
    const place = (x: number, y: number, h: number) => {
      // Clamp within the screen so the menu never bleeds off the right edge.
      const left = Math.max(sc(12), Math.min(x, screenW - menuW - sc(12)));
      setMenu({ group: g, left, top: y + h + sc(6) });
    };
    const node = anchors.current[g];
    if (node?.measureInWindow) node.measureInWindow((x: number, y: number, _w: number, h: number) => place(x, y, h));
    else place(sc(14), sc(150), 0);
  };
  const pick = (code: string) => { setMenu(null); onSelect(code); };

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
        {menuGroups.map(g => {
          const isOpen = menu?.group === g;
          return (
            <TouchableOpacity
              key={g}
              ref={node => { anchors.current[g] = node; }}
              style={[s.pill, isOpen && s.pillOpen]}
              onPress={() => open(g)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillLabel, isOpen && s.pillLabelOpen]}>{groupLabel(g)}</Text>
              <View style={[s.chev, isOpen && s.chevOpen]}>
                <IconChev size={sc(9)} color={isOpen ? colors.green : colors.ink2} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={menu !== null} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        {/* Transparent backdrop: captures the outside tap to dismiss, dropdown-style. */}
        <Pressable style={s.backdrop} onPress={() => setMenu(null)}>
          {menu && (
            <Pressable style={[s.menu, { left: menu.left, top: menu.top, width: menuW }]} onPress={() => {}}>
              {openPills.map((p, i) => (
                <TouchableOpacity
                  key={p.code}
                  style={[s.menuRow, i > 0 && s.menuDiv]}
                  onPress={() => pick(p.code)}
                  activeOpacity={0.6}
                >
                  <Text style={s.menuLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          )}
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
  // Right-chevron rotated to a down-caret; flips up while the menu is open.
  chev: { transform: [{ rotate: '90deg' }] },
  chevOpen: { transform: [{ rotate: '-90deg' }] },

  backdrop: { flex: 1, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    backgroundColor: colors.cream,
    borderWidth: 1, borderColor: colors.line2, borderRadius: 12,
    paddingVertical: 3, overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: { paddingVertical: 10, paddingHorizontal: 13 },
  menuDiv: { borderTopWidth: 1, borderTopColor: colors.line },
  menuLabel: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '600', color: colors.ink },
});
