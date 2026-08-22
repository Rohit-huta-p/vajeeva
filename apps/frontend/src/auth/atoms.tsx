import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, shadows } from '../theme/tokens';
import { scaledSheet, sc } from '../theme/scale';

// Shared atoms for the auth wave (refs: prototypes/screens/{opening,login-step*,
// signup-step*,onboarding}.html). Auth-only — app-wide atoms stay in
// src/components/shared/.

export function AuthTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function AuthNote({ children }: { children: React.ReactNode }) {
  return <Text style={s.note}>{children}</Text>;
}

export function AuthInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      style={s.input}
      {...props}
    />
  );
}

/** Prototype .st-cta-off — the disabled sand Continue before input is valid. */
export function ContinueButton({ enabled, label = 'Continue', onPress }: {
  enabled: boolean; label?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.continue, enabled ? s.continueOn : s.continueOff]}
      onPress={onPress}
      disabled={!enabled}
      activeOpacity={0.85}
    >
      <Text style={[s.continueTxt, enabled ? s.continueTxtOn : s.continueTxtOff]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function OrDivider({ label = 'or continue with' }: { label?: string }) {
  return (
    <View style={s.div}>
      <View style={s.divLine} />
      <Text style={s.divTxt}>{label}</Text>
      <View style={s.divLine} />
    </View>
  );
}

function GoogleG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <Path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </Svg>
  );
}

/**
 * Google SSO seam. Ships disabled until the OAuth client IDs + sign-in dep
 * land (AUTH-WAVE gating): pressing it explains instead of signing in. When
 * SSO is wired, pass onPress and it becomes live.
 */
export function GoogleButton({ onPress }: { onPress?: () => void }) {
  const [hint, setHint] = useState(false);
  const disabled = !onPress;
  return (
    <View>
      <TouchableOpacity
        style={[s.google, disabled && s.googleDim]}
        onPress={disabled ? () => setHint(true) : onPress}
        activeOpacity={0.85}
      >
        <GoogleG size={sc(15)} />
        <Text style={s.googleTxt}>Continue with Google</Text>
      </TouchableOpacity>
      {hint ? <Text style={s.googleHint}>Google sign-in is almost ready — use email for now.</Text> : null}
    </View>
  );
}

/** Prototype .st-chip — entered-email recap with an Edit affordance. */
export function EmailChip({ email, onEdit }: { email: string; onEdit: () => void }) {
  return (
    <View style={s.chipRow}>
      <View style={s.chip}>
        <Text style={s.chipTxt}>{email}</Text>
        <TouchableOpacity onPress={onEdit}><Text style={s.chipEdit}>Edit</Text></TouchableOpacity>
      </View>
    </View>
  );
}

/** Prototype .ob-dots — wizard progress (active dot is the 20px green pill). */
export function StepDots({ total, active }: { total: number; active: number }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotOn]} />
      ))}
    </View>
  );
}

export function FootLink({ text, linkText, onPress }: {
  text: string; linkText: string; onPress: () => void;
}) {
  return (
    <Text style={s.foot}>
      {text}{' '}
      <Text style={s.footLink} onPress={onPress}>{linkText}</Text>
    </Text>
  );
}

export function AuthHint({ children }: { children: React.ReactNode }) {
  return <Text style={s.hint}>{children}</Text>;
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return <Text style={s.error}>{children}</Text>;
}

const s = scaledSheet({
  title: {
    fontFamily: fonts.serif, fontSize: 23, fontWeight: '700', color: colors.ink,
    textAlign: 'center', lineHeight: 28.75, marginHorizontal: 10, marginBottom: 6,
  },
  note: {
    fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'center',
    marginHorizontal: 20, marginBottom: 18, lineHeight: 16.3,
  },
  input: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14,
    fontSize: 12.5, fontFamily: fonts.sans, color: colors.ink, textAlign: 'center',
    ...shadows.card,
  },
  continue: { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 10 },
  continueOn: { backgroundColor: colors.green, ...shadows.card },
  continueOff: { backgroundColor: colors.sand },
  continueTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800' },
  continueTxtOn: { color: colors.onGreen },
  continueTxtOff: { color: colors.muted },
  div: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.line2 },
  divTxt: {
    fontSize: 9, fontFamily: fonts.mono, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.9,
  },
  google: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line2,
    borderRadius: 14, padding: 12, ...shadows.card,
  },
  googleDim: { opacity: 0.55 },
  googleTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  googleHint: {
    fontSize: 9.5, fontFamily: fonts.sans, color: colors.amber2,
    textAlign: 'center', marginTop: 6,
  },
  chipRow: { alignItems: 'center', marginBottom: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, ...shadows.card,
  },
  chipTxt: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink },
  chipEdit: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '800', color: colors.amber2 },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center', paddingTop: 8, paddingBottom: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line2 },
  dotOn: { width: 20, backgroundColor: colors.green },
  foot: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'center', paddingVertical: 8 },
  footLink: { color: colors.green, fontWeight: '800' },
  hint: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', marginTop: 8 },
  error: { fontSize: 10, fontFamily: fonts.sans, fontWeight: '700', color: colors.clay, textAlign: 'center', marginTop: 8 },
});
