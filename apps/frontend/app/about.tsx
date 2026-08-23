import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../src/theme/ThemeContext';
import { InfoScreen, InfoSection, InfoParagraph } from '../src/components/shared/InfoScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function AboutRoute() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <InfoScreen title="About Vajeeva">
        <InfoParagraph>
          Vajeeva is an Ayurvedic recipe companion — traditional Indian recipes grounded in classical
          Sanskrit texts and modern nutrition, with gentle guidance tuned to your health profile.
        </InfoParagraph>
        <InfoSection label="Grounded in">
          <InfoParagraph>
            Recipes draw on classical sources such as the Kṣemakutūhalam, read alongside ICMR-NIN 2024
            nutritional guidance. Every recipe cites where its method comes from.
          </InfoParagraph>
        </InfoSection>
        <InfoSection label="Made to work anywhere">
          <InfoParagraph>
            Saved recipes and your health profile are kept on your device and work fully offline.
          </InfoParagraph>
        </InfoSection>
        <InfoParagraph muted>Version {version} · grounded in classical texts</InfoParagraph>
      </InfoScreen>
    </SafeAreaView>
  );
}
