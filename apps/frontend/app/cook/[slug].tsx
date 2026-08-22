import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/tokens';
import { CookModeScreen } from '../../src/screens/CookModeScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on
// Android; keeps the progress line out of the status bar. Dark cm background
// so the inset strip matches the cook theme.
export default function CookModeRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cmBg }} edges={['top']}>
      <CookModeScreen />
    </SafeAreaView>
  );
}
