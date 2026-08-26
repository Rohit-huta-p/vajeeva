import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { RecipeListScreen } from '../src/screens/RecipeListScreen';

// Route-level top inset: RN core SafeAreaView inside the screen is a no-op on
// Android, so the header would sit under the status bar without this.
export default function RecipeListRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <RecipeListScreen />
    </SafeAreaView>
  );
}
