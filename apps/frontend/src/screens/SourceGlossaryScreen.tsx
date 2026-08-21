import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { IconBack } from '../components/shared/icons';
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
      {/* Hero (prototype .gloss-hero) */}
      <View style={s.hero}>
        <View style={s.heroRow}>
          <TouchableOpacity style={s.icobtn} onPress={() => router.back()}>
            <IconBack size={15} color={colors.ink} />
          </TouchableOpacity>
          <View style={s.grow} />
          <Text style={s.navRight}>SOURCE</Text>
        </View>
        {status === 'ready' && source ? (
          <>
            <Text style={s.eyebrow}>{source.type}</Text>
            <Text style={s.title}>{source.name}</Text>
          </>
        ) : null}
      </View>
      {status === 'loading' ? (
        <ActivityIndicator style={s.loading} color={colors.green} />
      ) : status === 'missing' || !source ? (
        <View style={s.block}>
          <Text style={s.title}>Source not found</Text>
          <Text style={s.blockText}>This classical source isn't in the glossary yet.</Text>
        </View>
      ) : (
        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
          <View style={s.block}>
            <Text style={s.blockLabel}>Cited in</Text>
            <Text style={[s.blockText, s.cited]}>
              {source.recipeCount} {source.recipeCount === 1 ? 'recipe' : 'recipes'} in the Vajeeva collection
            </Text>
          </View>
          <View style={{ height: 16 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  hero: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  grow: { flex: 1 },
  icobtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  navRight: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  loading: { marginTop: 60 },
  eyebrow: {
    fontSize: 8.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber,
    letterSpacing: 0.85, textTransform: 'uppercase', marginBottom: 5,
  },
  title: { fontSize: 19, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 20 },
  block: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  blockLabel: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: 'rgba(42,37,30,0.3)',
    letterSpacing: 0.63, textTransform: 'uppercase', marginBottom: 5,
  },
  blockText: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 17.6 },
  cited: { color: colors.amber },
});
