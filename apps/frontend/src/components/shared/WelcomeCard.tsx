import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadows } from '../../theme/tokens';
import { MkSprout, IconChev } from './icons';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * First-run "Jump back in" replacement: a new patient has nothing to resume, so
 * this warm card orients them and funnels to the texture doors. onChooseTexture
 * scrolls to + pulses the pillars (Home owns that animation).
 */
export function WelcomeCard({ onChooseTexture }: { onChooseTexture: () => void }) {
  return (
    <LinearGradient
      colors={[colors.greenSoft, colors.cream]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.card}
    >
      <View style={s.art}><MkSprout size={sc(30)} /></View>
      <View style={s.body}>
        <Text style={s.eyebrow}>NEW HERE</Text>
        <Text style={s.title}>Start with something simple</Text>
        <Text style={s.sub}>The easiest way in is to pick a texture — solid, liquid or semi-solid.</Text>
        <TouchableOpacity style={s.cta} onPress={onChooseTexture} activeOpacity={0.85}>
          <Text style={s.ctaText}>Choose a texture</Text>
          <IconChev size={sc(13)} color={colors.onGreen} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = scaledSheet({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 12,
    ...shadows.card,
  },
  art: {
    width: 52, height: 52, borderRadius: 13,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 8, fontWeight: '700', letterSpacing: 1.1, color: colors.green },
  title: { fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2 },
  sub: { fontFamily: fonts.sans, fontSize: 10, lineHeight: 14, color: colors.ink2, marginTop: 3 },
  cta: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 9,
    backgroundColor: colors.green, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 8,
  },
  ctaText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '800', color: colors.onGreen },
});
