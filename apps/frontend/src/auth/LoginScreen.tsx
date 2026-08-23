import React, { useContext, useState } from 'react';
import {
  View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { type Colors } from '../theme/tokens';
import { scaledSheet } from '../theme/scale';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { AuthContext } from './AuthContext';
import { Disclaimer } from '../components/shared/Disclaimer';
import {
  AuthTitle, AuthNote, AuthInput, ContinueButton, OrDivider, GoogleButton,
  EmailChip, FootLink, AuthHint, AuthError,
} from './atoms';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Props = { navigation?: { navigate: (route: string) => void } };

// Progressive login (refs: login-step1/2.html): email question first, the
// password step slides in after Continue. Kept default-exported for the
// app/auth/login.tsx route adapter.
export default function LoginScreen(_props: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());

  const handleSignIn = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/' as any);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'That didn’t match — check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.wrap}>
          <View style={s.mid}>
            {step === 1 ? (
              <>
                <AuthTitle>What's your email address?</AuthTitle>
                <AuthNote>Welcome back — your kitchen is where you left it.</AuthNote>
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
            ) : (
              <>
                <AuthTitle>And your password?</AuthTitle>
                <AuthNote>Signing in as</AuthNote>
                <EmailChip email={email.trim().toLowerCase()} onEdit={() => { setStep(1); setError(null); }} />
                <AuthInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  autoFocus
                  onSubmitEditing={handleSignIn}
                />
                <View style={s.cta}>
                  {loading
                    ? <ActivityIndicator color={colors.green} style={s.spinner} />
                    : <ContinueButton enabled={password.length > 0} label="Sign in" onPress={handleSignIn} />}
                </View>
                {error
                  ? <AuthError>{error}</AuthError>
                  : <AuthHint>Your health details stay private — used only to flag recipes for you.</AuthHint>}
              </>
            )}
          </View>
          <FootLink
            text="New to Vajeeva?"
            linkText="Create account"
            onPress={() => router.push('/auth/signup' as any)}
          />
          <Disclaimer text="Supportive dietary guidance · not a substitute for medical advice" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export { LoginScreen };

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  flex: { flex: 1 },
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  mid: { flex: 1, justifyContent: 'center', paddingBottom: 34 },
  cta: { marginTop: 0 },
  spinner: { marginTop: 10, padding: 14 },
});
