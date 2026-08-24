import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, type Colors } from '../theme/tokens';
import { scaledSheet } from '../theme/scale';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { AuthContext } from './AuthContext';
import { Disclaimer } from '../components/shared/Disclaimer';
import {
  AuthTitle, AuthNote, AuthInput, ContinueButton, OrDivider, GoogleButton,
  EmailChip, StepDots, FootLink, AuthHint, AuthError, ChoiceChips,
} from './atoms';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

type Props = { navigation?: { navigate: (route: string) => void } };

// Progressive signup (refs: signup-step1/2/3.html) — email, password,
// name + age + gender + optional phone; step 4 of the dots is the health
// profile (/auth/onboarding). Default-exported for the app/auth/signup.tsx adapter.
export default function RegisterScreen(_props: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { register } = useContext(AuthContext);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;

  const ageTrimmed = age.trim();
  const ageNum = parseInt(ageTrimmed, 10);
  const ageValid = /^\d+$/.test(ageTrimmed) && ageNum >= 13 && ageNum <= 120;
  const step3Valid = name.trim().length > 0 && ageValid && gender !== null;

  const handleCreate = async () => {
    if (!step3Valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, {
        name: name.trim(),
        age: ageNum,
        gender: gender!,
        phone: phone.trim() || undefined,
      });
      router.replace('/auth/onboarding' as any);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Could not create the account — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.wrap}>
          <StepDots total={4} active={step - 1} />
          <View style={s.mid}>
            {step === 1 ? (
              <>
                <AuthTitle>What's your email address?</AuthTitle>
                <AuthNote>We'll build your kitchen around it. No spam — ever.</AuthNote>
                <AuthInput
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onSubmitEditing={() => emailValid && setStep(2)}
                />
                <ContinueButton enabled={emailValid} onPress={() => setStep(2)} />
                <OrDivider />
                <GoogleButton />
              </>
            ) : step === 2 ? (
              <>
                <AuthTitle>Create a password</AuthTitle>
                <AuthNote>Signing up as</AuthNote>
                <EmailChip email={email.trim().toLowerCase()} onEdit={() => setStep(1)} />
                <AuthInput
                  placeholder="8+ characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  autoFocus
                  onSubmitEditing={() => passwordValid && setStep(3)}
                />
                <ContinueButton enabled={passwordValid} onPress={() => setStep(3)} />
              </>
            ) : (
              <ScrollView
                contentContainerStyle={s.midScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <AuthTitle>Tell us about you</AuthTitle>
                <AuthNote>
                  This personalizes your health guidance. Phone is optional — it unlocks phone sign-in later.
                </AuthNote>
                <Text style={s.lbl}>Name</Text>
                <AuthInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  autoFocus
                />
                <Text style={s.lbl}>Age</Text>
                <AuthInput
                  placeholder="Your age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={s.lbl}>Gender</Text>
                <ChoiceChips
                  options={GENDER_OPTIONS}
                  value={gender}
                  onChange={(v) => setGender(v as Gender)}
                />
                <Text style={s.lbl}>Phone · optional</Text>
                <AuthInput
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  onSubmitEditing={handleCreate}
                />
                {loading
                  ? <ActivityIndicator color={colors.green} style={s.spinner} />
                  : <ContinueButton enabled={step3Valid} onPress={handleCreate} />}
                {error
                  ? <AuthError>{error}</AuthError>
                  : <AuthHint>Next: your health profile — optional, 30 seconds, editable anytime.</AuthHint>}
              </ScrollView>
            )}
          </View>
          <FootLink
            text="Already have an account?"
            linkText="Sign in"
            onPress={() => router.push('/auth/login' as any)}
          />
          <Disclaimer text="Supportive dietary guidance · not a substitute for medical advice" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export { RegisterScreen };

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  flex: { flex: 1 },
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  mid: { flex: 1, justifyContent: 'center', paddingBottom: 34 },
  // Step 3 grew to 4 fields — scrollable so small screens don't clip the
  // Continue button when the keyboard is up (steps 1-2 stay a plain View).
  midScroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 34 },
  lbl: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.labelFaint,
    letterSpacing: 0.72, textTransform: 'uppercase', textAlign: 'center',
    marginTop: 14, marginBottom: 5,
  },
  spinner: { marginTop: 10, padding: 14 },
});
