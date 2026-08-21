import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { IconButton } from '../components/shared/IconButton';

// ponytail: placeholder data; replace with sourcesApi.get(slug)
const PLACEHOLDER = {
  eyebrow: 'Classical text · ~16th century CE',
  title: 'Samayamulu',
  subtitle: 'Culinary treatise on seasonal foods and medicinal preparations',
  blocks: [
    { label: 'OVERVIEW', text: 'A Telugu culinary text documenting seasonal recipes and their therapeutic applications.' },
    { label: 'CHAPTER REFERENCE', text: 'Referenced in Chapter 4, verse 12–18 for bitter preparations.' },
  ],
  alsoIn: ['Paavakkai Pitla', 'Methi Rasam'],
};

export function SourceGlossaryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const src = PLACEHOLDER;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.nav}>
        <IconButton icon="←" onPress={() => router.back()} />
        <Text style={s.navRight}>SOURCE</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.eyebrow}>{src.eyebrow}</Text>
        <Text style={s.title}>{src.title}</Text>
        <Text style={s.subtitle}>{src.subtitle}</Text>
        {src.blocks.map(b => (
          <View key={b.label} style={s.block}>
            <Text style={s.blockLabel}>{b.label}</Text>
            <Text style={s.blockText}>{b.text}</Text>
          </View>
        ))}
        <View style={s.block}>
          <Text style={s.blockLabel}>ALSO CITED IN</Text>
          {src.alsoIn.map(r => (
            <Text key={r} style={s.cited}>{r}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  nav: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  navRight: { flex: 1, textAlign: 'right', fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  eyebrow: { fontSize: 8.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber, letterSpacing: 0.08, marginBottom: 6 },
  title: { fontSize: 19, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.ink2, marginBottom: spacing.xl },
  block: { marginBottom: spacing.lg },
  blockLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.ink, opacity: 0.3, marginBottom: 6, letterSpacing: 0.1 },
  blockText: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 16 },
  cited: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.amber, marginBottom: 3 },
});
