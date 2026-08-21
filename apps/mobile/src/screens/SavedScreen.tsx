import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Recipe } from '../components/RecipeCard';
import { colors } from '../theme';
import { recipesApi } from '../api';

export default function SavedScreen() {
  const [saved, setSaved] = useState<Recipe[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const all = await recipesApi.list();
        if (mounted) setSaved(all.filter((r: any) => r.status === 'published'));
      } catch (e) {
        console.warn('Failed to load saved', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Saved</Text>
      {saved.length === 0 ? (
        <Text style={styles.empty}>No saved recipes yet.</Text>
      ) : (
        saved.map(r => (
          <Text key={r.slug} style={styles.item}>{r.nameEn}</Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bone, padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  empty:   { textAlign: 'center', color: colors.muted, marginTop: 40 },
  item:    { padding: 12, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.line },
});
