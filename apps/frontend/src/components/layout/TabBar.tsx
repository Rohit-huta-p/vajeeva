import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { IconHome, IconBook, IconMore } from '../shared/icons';
import { scaledSheet, sc } from '../../theme/scale';

const TABS = [
  { href: '/', label: 'Home', Icon: IconHome },
  { href: '/saved', label: 'Saved', Icon: IconBook },
  { href: '/more', label: 'More', Icon: IconMore },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map(tab => {
        const active = pathname === tab.href;
        return (
          <TouchableOpacity
            key={tab.href}
            style={s.item}
            onPress={() => router.push(tab.href as any)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <tab.Icon size={sc(20)} color={active ? colors.green : colors.muted} />
            <Text style={[s.label, active && s.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = scaledSheet({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: { flex: 1, alignItems: 'center', paddingTop: 10, gap: 3 },
  label: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '600', color: colors.muted },
  activeLabel: { color: colors.green },
});
