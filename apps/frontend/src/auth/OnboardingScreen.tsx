import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { scaledSheet, sc } from '../theme/scale';
import { IconCheck } from '../components/shared/icons';
import { StepDots } from './atoms';
import { api } from '../api';
import * as storage from '../offline/storage';

interface Flag { code: string; label: string; description: string }

// The four seeded condition flags — the client-side fallback until BE-AUTH
// ships public GET /api/healthflags (which then takes over via the fetch).
const FALLBACK_FLAGS: Flag[] = [
  { code: 'DM', label: 'Diabetes', description: 'High-sugar preparations get flagged' },
  { code: 'OW', label: 'Overweight / Obesity', description: 'Calorie-dense dishes get a caution' },
  { code: 'LI', label: 'Lactose intolerance', description: 'Dairy — milk, ghee, curd — gets flagged' },
  { code: 'SD', label: 'Sedentary lifestyle', description: 'Rich fat/sugar dishes get portion notes' },
];

// Signup step 4 of 4 — health profile (ref: prototypes/screens/onboarding.html).
// Skippable by design: most of the value is a single tap away, never a wall.
export function OnboardingScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<Flag[]>(FALLBACK_FLAGS);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    api.get<Flag[]>('/api/healthflags')
      .then(r => { if (alive && Array.isArray(r.data) && r.data.length) setFlags(r.data); })
      .catch(() => {}); // endpoint lands with BE-AUTH — fallback list until then
    return () => { alive = false; };
  }, []);

  const toggle = (code: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const finish = async (codes: string[]) => {
    // Local copy is the source for "Safe for me" either way; the PATCH is the
    // BE-AUTH seam (today's API has no /users/me — the catch keeps flow alive).
    await storage.set('healthProfile', codes).catch(() => {});
    if (codes.length) await api.patch('/api/users/me', { healthProfile: codes }).catch(() => {});
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
          <View style={s.grid}>
            {flags.map(f => {
              const on = picked.has(f.code);
              return (
                <TouchableOpacity
                  key={f.code}
                  style={[s.card, on && s.cardOn]}
                  onPress={() => toggle(f.code)}
                  activeOpacity={0.85}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[s.check, on && s.checkOn]}>
                    {on ? <IconCheck size={sc(11)} color="#FFFFFF" /> : null}
                  </View>
                  <View style={s.cardBody}>
                    <Text style={s.cardName}>{f.label}</Text>
                    <Text style={s.cardNote}>{f.description}</Text>
                  </View>
                  <Text style={s.cardCode}>{f.code}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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

const s = scaledSheet({
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
  grid: { gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, paddingVertical: 11, paddingHorizontal: 12, ...shadows.card,
  },
  cardOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  check: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.green },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  cardNote: { fontSize: 9, fontFamily: fonts.sans, color: colors.ink2, marginTop: 1, lineHeight: 13 },
  cardCode: { fontSize: 8.5, fontFamily: fonts.mono, color: colors.muted },
  cta: {
    backgroundColor: colors.green, borderRadius: 14, padding: 14,
    alignItems: 'center', ...shadows.card,
  },
  ctaTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
  ghost: { alignItems: 'center', paddingVertical: 10 },
  ghostTxt: { fontSize: 12.5, fontFamily: fonts.sans, fontWeight: '800', color: colors.ink2 },
});
