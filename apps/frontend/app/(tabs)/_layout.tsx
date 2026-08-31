import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { useIsDesktop } from '../../src/hooks/useIsDesktop';
import { TabBar } from '../../src/components/layout/TabBar';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { OfflineBanner } from '../../src/components/shared/OfflineBanner';

// Top inset lives here, not in the screens: RN core SafeAreaView is a no-op on
// Android, so without this the headers sit under the status bar. Screens keep
// their own (iOS-frame-aware) SafeAreaView — no double padding. Bottom edge is
// owned by TabBar / the screens.
export default function TabsLayout() {
  const { colors } = useTheme();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    // Desktop: Expo Router Tabs still handles routing; default tab bar is
    // hidden and the Sidebar renders alongside the screen area.
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bone }]} edges={['top']}>
        <View style={s.shell}>
          <Sidebar />
          <View style={s.main}>
            <OfflineBanner />
            <Tabs tabBar={() => null} screenOptions={{ headerShown: false }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bone }]} edges={['top']}>
      <OfflineBanner />
      <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
});
