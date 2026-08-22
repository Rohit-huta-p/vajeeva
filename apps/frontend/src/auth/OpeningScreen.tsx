import React, { useState, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, shadows } from '../theme/tokens';
import { scaledSheet, sc } from '../theme/scale';
import { IllHero, IconHeart, IconBook } from '../components/shared/icons';
import { ContraDots } from '../components/shared/ContraDots';
import { AuthContext } from './AuthContext';

// Welcome carousel (ref: prototypes/screens/opening.html — panel 1; panels 2-3
// tell the health-flags and offline stories with the same layout grammar).
const PANELS = [
  {
    title: 'Welcome to', brand: 'Vajeeva',
    sub: 'Recipes rooted in classical texts — flagged for your health, saved for your kitchen, ready offline.',
  },
  {
    title: 'Flags that fit', brand: 'your health',
    sub: 'Tell us your conditions once — recipes that need care show quiet clay dots, with the reason spelled out inside.',
  },
  {
    title: 'Your kitchen,', brand: 'always with you',
    sub: 'Saved recipes work completely offline — kitchen, market, anywhere. Cook mode keeps the screen awake.',
  },
];

export function OpeningScreen() {
  const router = useRouter();
  const { continueAsGuest } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={s.pager}
      >
        {PANELS.map((p, i) => (
          <View key={i} style={[s.panel, { width }]}>
            <Text style={s.title}>
              {p.title}{'\n'}<Text style={s.brand}>{p.brand}</Text>
            </Text>
            <Text style={s.sub}>{p.sub}</Text>
            {i === 0 ? <Text style={s.swipe}>Swipe to learn more →</Text> : null}
            <View style={s.hero}>
              {i === 1 ? (
                <View style={s.featWrap}>
                  <IconHeart size={sc(54)} color={colors.clay} />
                  <View style={s.featDots}><ContraDots count={3} /></View>
                </View>
              ) : i === 2 ? (
                <IconBook size={sc(64)} color={colors.green} />
              ) : (
                <IllHero width={sc(250)} height={sc(188)} />
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={s.dots}>
        {PANELS.map((_, i) => (
          <View key={i} style={[s.dot, i === page && s.dotOn]} />
        ))}
      </View>
      <View style={s.btns}>
        <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/auth/login' as any)} activeOpacity={0.85}>
          <Text style={s.loginTxt}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.signupBtn} onPress={() => router.push('/auth/signup' as any)} activeOpacity={0.85}>
          <Text style={s.signupTxt}>Sign up</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.guest}>
        Just browsing?{' '}
        <Text style={s.guestLink} onPress={() => { continueAsGuest(); router.replace('/' as any); }}>
          Explore without an account
        </Text>
      </Text>
    </SafeAreaView>
  );
}

// Route adapter (app/auth/opening.tsx) default-imports; keep both exports.
export default OpeningScreen;

const s = scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  pager: { flex: 1 },
  panel: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  title: {
    fontFamily: fonts.serif, fontSize: 26, fontWeight: '700', color: colors.ink,
    textAlign: 'center', lineHeight: 30.7, marginTop: 30, letterSpacing: -0.26,
  },
  brand: { color: colors.green },
  sub: {
    fontSize: 11.5, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'center',
    lineHeight: 18.4, marginTop: 10, marginHorizontal: 24,
  },
  swipe: {
    fontSize: 11, fontFamily: fonts.sans, fontWeight: '800', color: colors.amber2,
    textAlign: 'center', marginTop: 12,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  featWrap: { alignItems: 'center', gap: 14 },
  featDots: { transform: [{ scale: 2 }] },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center', paddingBottom: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line2 },
  dotOn: { width: 20, backgroundColor: colors.green },
  btns: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  loginBtn: {
    flex: 1, backgroundColor: colors.cream, borderWidth: 1.5, borderColor: colors.green,
    borderRadius: 14, padding: 13, alignItems: 'center', ...shadows.card,
  },
  loginTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.green },
  signupBtn: {
    flex: 1, backgroundColor: colors.green, borderRadius: 14, padding: 13,
    alignItems: 'center', ...shadows.card,
  },
  signupTxt: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
  guest: {
    fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2,
    textAlign: 'center', paddingTop: 10, paddingBottom: 12,
  },
  guestLink: { color: colors.amber2, fontWeight: '800' },
});
