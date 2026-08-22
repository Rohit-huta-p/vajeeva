import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/tokens';
import { RecipeDetailScreen } from '../../src/screens/RecipeDetailScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function RecipeDetailRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <RecipeDetailScreen />
    </SafeAreaView>
  );
}
