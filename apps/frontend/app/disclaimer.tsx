import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/tokens';
import { InfoScreen, InfoParagraph } from '../src/components/shared/InfoScreen';

// Route-level top inset — RN core SafeAreaView in the screen is a no-op on Android.
export default function DisclaimerRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bone }} edges={['top']}>
      <InfoScreen title="Medical disclaimer">
        <InfoParagraph>
          Vajeeva offers supportive dietary guidance rooted in traditional texts and modern nutrition.
          It is not a substitute for professional medical advice, diagnosis, or treatment.
        </InfoParagraph>
        <InfoParagraph>
          Always consult a qualified healthcare provider about your health conditions, and before
          making dietary changes — especially during pregnancy or lactation, for infants, or if you
          manage a condition such as diabetes. The “Safe for me” flags are guidance, not medical
          direction.
        </InfoParagraph>
      </InfoScreen>
    </SafeAreaView>
  );
}
