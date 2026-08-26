import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { sc } from '../src/theme/scale';
import { InfoScreen, InfoParagraph } from '../src/components/shared/InfoScreen';
import { SettingsGroup, SettingsRow } from '../src/components/shared/Settings';
import { IconLeaf } from '../src/components/shared/icons';
import { sourcesApi } from '../src/api';

interface SourceItem { slug: string; name: string; recipeCount?: number }

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function SourcesRoute() {
  const { colors } = useTheme();
  const router = useRouter();
  const [sources, setSources] = useState<SourceItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    sourcesApi.list()
      .then((rows: any[]) => { if (alive) setSources(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setSources([]); });
    return () => { alive = false; };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <InfoScreen title="Sources & method">
        <InfoParagraph>
          Vajeeva's recipes are grounded in classical Sanskrit texts and read alongside ICMR-NIN 2024
          nutrition. These are the sources our recipes cite — tap one to read more.
        </InfoParagraph>
        <View style={{ height: 14 }} />
        {sources === null ? (
          <ActivityIndicator color={colors.green} style={{ marginTop: 16 }} />
        ) : sources.length ? (
          <SettingsGroup flush>
            {sources.map(src => (
              <SettingsRow
                key={src.slug}
                icon={<IconLeaf size={sc(15)} color={colors.ink} />}
                label={src.name}
                value={src.recipeCount ? String(src.recipeCount) : undefined}
                onPress={() => router.push(`/source/${src.slug}` as any)}
              />
            ))}
          </SettingsGroup>
        ) : (
          <InfoParagraph muted>Sources will appear here once you're online.</InfoParagraph>
        )}
      </InfoScreen>
    </SafeAreaView>
  );
}
