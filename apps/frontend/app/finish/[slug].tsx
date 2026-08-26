import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/tokens';
import { FinishScreen } from '../../src/screens/FinishScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on
// Android. Dark cm background so the inset strip matches the finish theme.
export default function FinishRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cmBg }} edges={['top']}>
      {/* Dark cm theme: light status-bar icons while this route is focused. */}
      <StatusBar style="light" />
      <FinishScreen />
    </SafeAreaView>
  );
}
