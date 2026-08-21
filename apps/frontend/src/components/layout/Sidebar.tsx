import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../../theme/tokens';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/saved', label: 'Saved' },
  { href: '/more', label: 'Settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View style={s.sidebar}>
      <View style={s.logo}>
        <View style={s.logoMark}>
          <Text style={s.logoV}>V</Text>
        </View>
        <Text style={s.brand}>Vajeeva</Text>
      </View>
      {NAV.map(item => {
        const active = pathname === item.href;
        return (
          <TouchableOpacity
            key={item.href}
            style={[s.navItem, active && s.navActive]}
            onPress={() => router.push(item.href as any)}
          >
            <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.sand,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    paddingTop: 24,
    paddingHorizontal: spacing.md,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  logoV: { color: colors.onGreen, fontSize: 16, fontFamily: fonts.serif, fontWeight: '700' },
  brand: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  navItem: {
    paddingVertical: 9, paddingHorizontal: spacing.sm,
    borderRadius: 9, marginBottom: 2,
  },
  navActive: { backgroundColor: colors.green },
  navLabel: { fontSize: 14, fontFamily: fonts.sans, color: colors.ink2 },
  navLabelActive: { color: colors.onGreen, fontWeight: '600' },
});
