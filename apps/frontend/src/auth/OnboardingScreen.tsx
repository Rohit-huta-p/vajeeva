import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, shadows, type Colors } from '../theme/tokens';
import { scaledSheet } from '../theme/scale';
import { useThemedStyles } from '../theme/ThemeContext';
import { StepDots } from './atoms';
import { HealthFlagGrid } from '../components/shared/HealthFlagGrid';
import { useHealthFlags } from '../hooks/useHealthFlags';
import { useHealthProfile } from '../hooks/useHealthProfile';

// Signup step 4 of 4 — health profile (ref: prototypes/screens/onboarding.html).
// Skippable by design: most of the value is a single tap away, never a wall.
// The flag list, the condition grid, and the save (local store + best-effort
// PATCH) are shared with the Settings health-profile editor so the two never
// drift — see useHealthFlags / HealthFlagGrid / useHealthProfile.
export function OnboardingScreen() {
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const flags = useHealthFlags();
  const { save } = useHealthProfile();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (code: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const finish = async (codes: string[]) => {
    await save(codes);
    router.replace('/' as any);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.wrap}>
        <StepDots total={4} active={3} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.eyebrow}>Step 4 of 4 · Health profile</Text>
          <Text style={s.title}>Do any of these apply to you?</Text>
          <Text style={s.sub}>
            Recipes that need care with your conditions get a flag, and the "Safe for me" filter
            hides them. Optional — edit anytime in Settings.
          </Text>
          <HealthFlagGrid flags={flags} selected={picked} onToggle={toggle} />
        </ScrollView>
        <TouchableOpacity style={s.cta} onPress={() => finish([...picked])} activeOpacity={0.85}>
          <Text style={s.ctaTxt}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghost} onPress={() => finish([])}>
          <Text style={s.ghostTxt}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Route adapter (app/auth/onboarding.tsx) default-imports; keep both exports.
export default OnboardingScreen;

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  wrap: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 },
  scroll: { paddingBottom: 10 },
  eyebrow: {
    fontSize: 8.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber,
    letterSpacing: 0.85, textTransform: 'uppercase', textAlign: 'center', marginTop: 10,
  },
  title: {
    fontFamily: fonts.serif, fontSize: 19, fontWeight: '700', color: colors.ink,
    textAlign: 'center', marginTop: 5,
  },
  sub: {
    fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'center',
    lineHeight: 16.3, marginTop: 6, marginHorizontal: 24, marginBottom: 14,
  },
  cta: {
    backgroundColor: colors.green, borderRadius: 14, padding: 14,
    alignItems: 'center', ...shadows.card,
  },
  ctaTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
  ghost: { alignItems: 'center', paddingVertical: 10 },
  ghostTxt: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '800', color: colors.ink2 },
});
