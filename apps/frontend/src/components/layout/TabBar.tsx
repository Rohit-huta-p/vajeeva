import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';

const TABS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/saved', label: 'Saved', icon: '♡' },
  { href: '/more', label: 'More', icon: '≡' },
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
            <Text style={[s.icon, active && s.activeIcon]}>{tab.icon}</Text>
            <Text style={[s.label, active && s.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: { flex: 1, alignItems: 'center', paddingTop: 10 },
  icon: { fontSize: 20, color: colors.muted },
  activeIcon: { color: colors.green },
  label: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.muted, marginTop: 2 },
  activeLabel: { color: colors.green },
});
