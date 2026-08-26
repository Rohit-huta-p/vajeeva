import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, type Colors } from '../../theme/tokens';
import { scaledSheet, sc } from '../../theme/scale';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { IconButton } from './IconButton';
import { IconBack } from './icons';

// Shared scaffold for pushed content screens (About / Sources / Disclaimer):
// back header + centred serif title + scrollable body. The route file supplies
// the top safe-area inset (RN core SafeAreaView is a no-op on Android).
export function InfoScreen({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  return (
    <View style={s.root}>
      <View style={s.header}>
        <IconButton icon={<IconBack size={sc(18)} color={colors.ink} />} onPress={() => router.back()} />
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={s.spacer} />
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

export function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.section}>
      <Text style={s.eyebrow}>{label}</Text>
      {children}
    </View>
  );
}

export function InfoParagraph({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const s = useThemedStyles(makeStyles);
  return <Text style={[s.p, muted && s.pMuted]}>{children}</Text>;
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8,
  },
  title: {
    flex: 1, textAlign: 'center', fontFamily: fonts.serif, fontWeight: '700',
    fontSize: 16, color: colors.ink, marginHorizontal: 8,
  },
  spacer: { width: sc(34) },
  body: { paddingHorizontal: 18, paddingBottom: 28, paddingTop: 4 },
  section: { marginTop: 18 },
  eyebrow: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.72,
    textTransform: 'uppercase', color: colors.labelFaint, marginBottom: 7,
  },
  p: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.ink2, lineHeight: 19, marginTop: 8 },
  pMuted: { fontSize: 10.5, color: colors.muted, marginTop: 14 },
});
