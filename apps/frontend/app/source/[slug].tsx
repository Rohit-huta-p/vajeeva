import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { SourceGlossaryScreen } from '../../src/screens/SourceGlossaryScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function SourceGlossaryRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <SourceGlossaryScreen />
    </SafeAreaView>
  );
}
