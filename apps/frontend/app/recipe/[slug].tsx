import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { RecipeDetailScreen } from '../../src/screens/RecipeDetailScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function RecipeDetailRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <RecipeDetailScreen />
    </SafeAreaView>
  );
}
