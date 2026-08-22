import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../theme/tokens';
import { scaledSheet } from '../theme/scale';
import { AuthContext } from './AuthContext';
import { Disclaimer } from '../components/shared/Disclaimer';
import {
  AuthTitle, AuthNote, AuthInput, ContinueButton, OrDivider, GoogleButton,
  EmailChip, StepDots, FootLink, AuthHint, AuthError,
} from './atoms';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Props = { navigation?: { navigate: (route: string) => void } };

// Progressive signup (refs: signup-step1/2/3.html) — email, password,
// name + optional phone; step 4 of the dots is the health profile
// (/auth/onboarding). Default-exported for the app/auth/signup.tsx adapter.
export default function RegisterScreen(_props: Props) {
  const router = useRouter();
  const { register } = useContext(AuthContext);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;

  const handleCreate = async () => {
    if (!name.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, {
        name: name.trim(),
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
              <>
                <AuthTitle>Tell us about you</AuthTitle>
                <AuthNote>
                  Your name signs your kitchen. The number is optional — it unlocks phone sign-in later.
                </AuthNote>
                <Text style={s.lbl}>Name</Text>
                <AuthInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  autoFocus
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
                  : <ContinueButton enabled={name.trim().length > 0} onPress={handleCreate} />}
                {error
                  ? <AuthError>{error}</AuthError>
                  : <AuthHint>Next: your health profile — optional, 30 seconds, editable anytime.</AuthHint>}
              </>
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

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  flex: { flex: 1 },
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  mid: { flex: 1, justifyContent: 'center', paddingBottom: 34 },
  lbl: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: 'rgba(42,37,30,0.4)',
    letterSpacing: 0.72, textTransform: 'uppercase', textAlign: 'center',
    marginTop: 14, marginBottom: 5,
  },
  spinner: { marginTop: 10, padding: 14 },
});
