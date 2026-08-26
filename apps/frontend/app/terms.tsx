import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { InfoScreen, InfoSection, InfoParagraph } from '../src/components/shared/InfoScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function TermsRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <InfoScreen title="Terms of Service">
        <InfoParagraph>
          Vajeeva provides traditional recipes and supportive dietary guidance for personal,
          non-commercial use.
        </InfoParagraph>
        <InfoSection label="Not medical advice">
          <InfoParagraph>
            Recipe guidance and health flags are informational and not a substitute for professional
            medical advice — see the Medical disclaimer.
          </InfoParagraph>
        </InfoSection>
        <InfoSection label="Your account">
          <InfoParagraph>
            You're responsible for keeping your login secure, and you can delete your account at any
            time from Settings.
          </InfoParagraph>
        </InfoSection>
        <InfoSection label="Content">
          <InfoParagraph>
            Recipe content and classical-source references are provided for your personal use.
          </InfoParagraph>
        </InfoSection>
        <InfoParagraph muted>
          This is a plain-language summary; the full Terms are published before release.
        </InfoParagraph>
      </InfoScreen>
    </SafeAreaView>
  );
}
