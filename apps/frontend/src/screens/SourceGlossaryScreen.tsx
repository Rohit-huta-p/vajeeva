import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { IconButton } from '../components/shared/IconButton';
import { sourcesApi } from '../api';

interface SourceDTO {
  id: string;
  name: string;
  type: string;
  recipeCount: number;
  slug: string;
}

export function SourceGlossaryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [source, setSource] = useState<SourceDTO | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    if (!slug) { setStatus('missing'); return; }
    sourcesApi.detail(slug)
      .then((doc: SourceDTO) => { if (alive) { setSource(doc); setStatus('ready'); } })
      .catch(() => { if (alive) setStatus('missing'); });
    return () => { alive = false; };
  }, [slug]);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.nav}>
        <IconButton icon="←" onPress={() => router.back()} />
        <Text style={s.navRight}>SOURCE</Text>
      </View>
      {status === 'loading' ? (
        <ActivityIndicator style={s.loading} color={colors.green} />
      ) : status === 'missing' || !source ? (
        <View style={s.body}>
          <Text style={s.title}>Source not found</Text>
          <Text style={s.blockText}>This classical source isn't in the glossary yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.eyebrow}>{source.type.toUpperCase()}</Text>
          <Text style={s.title}>{source.name}</Text>
          <View style={s.block}>
            <Text style={s.blockLabel}>CITED IN</Text>
            <Text style={s.blockText}>
              {source.recipeCount} {source.recipeCount === 1 ? 'recipe' : 'recipes'} in the Vajeeva collection
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  nav: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  navRight: { flex: 1, textAlign: 'right', fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  loading: { marginTop: 60 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  eyebrow: { fontSize: 8.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber, letterSpacing: 0.08, marginBottom: 6 },
  title: { fontSize: 19, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  block: { marginTop: spacing.md, marginBottom: spacing.lg },
  blockLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.ink, opacity: 0.3, marginBottom: 6, letterSpacing: 0.1 },
  blockText: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 16 },
});
