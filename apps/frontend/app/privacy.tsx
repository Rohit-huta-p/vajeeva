import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { InfoScreen, InfoSection, InfoParagraph } from '../src/components/shared/InfoScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function PrivacyRoute() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <InfoScreen title="Privacy Policy">
        <InfoParagraph>A plain-language summary of how Vajeeva handles your data.</InfoParagraph>
        <InfoSection label="What we store">
          <InfoParagraph>
            When you create an account we store your email, your optional name, and any health-profile
            conditions you choose — used to personalise recipe guidance and sync across your devices.
          </InfoParagraph>
        </InfoSection>
        <InfoSection label="On your device">
          <InfoParagraph>
            Saved recipes and app preferences are kept on this device and work offline. As a guest,
            nothing leaves your phone.
          </InfoParagraph>
        </InfoSection>
        <InfoSection label="What we don't do">
          <InfoParagraph>We don't sell your data or use third-party advertising trackers.</InfoParagraph>
        </InfoSection>
        <InfoSection label="Your control">
          <InfoParagraph>
            You can edit your health profile any time, and permanently delete your account and its
            data from this Settings screen.
          </InfoParagraph>
        </InfoSection>
        <InfoParagraph muted>
          This is a plain-language summary; the full published policy applies before release.
        </InfoParagraph>
      </InfoScreen>
    </SafeAreaView>
  );
}
