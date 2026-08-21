import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useIsDesktop } from '../../src/hooks/useIsDesktop';
import { TabBar } from '../../src/components/layout/TabBar';
import { Sidebar } from '../../src/components/layout/Sidebar';

export default function TabsLayout() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    // Desktop: Expo Router Tabs still handles routing; default tab bar is
    // hidden and the Sidebar renders alongside the screen area.
    return (
      <View style={s.shell}>
        <Sidebar />
        <View style={s.main}>
          <Tabs tabBar={() => null} screenOptions={{ headerShown: false }} />
        </View>
      </View>
    );
  }

  return <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false }} />;
}

const s = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
});
