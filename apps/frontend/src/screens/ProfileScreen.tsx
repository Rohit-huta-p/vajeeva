import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AuthContext } from '../auth/AuthContext';
import { usersApi } from '../api';
import { fonts, shadows, type Colors } from '../theme/tokens';
import { scaledSheet, sc } from '../theme/scale';
import { useTheme, useThemedStyles, type ThemeMode } from '../theme/ThemeContext';
import {
  IconUser, IconEdit, IconLeaf, IconShield, IconInfo, IconChat, IconStar, IconLogout,
  IconRuler, IconSun, IconDoc, IconTrash, IconTheme,
} from '../components/shared/icons';
import { SettingsGroup, SettingsRow, SettingsToggle } from '../components/shared/Settings';
import { HealthProfileSheet } from '../components/shared/HealthProfileSheet';
import { NameEditSheet } from '../components/shared/NameEditSheet';
import { ChoiceSheet } from '../components/shared/ChoiceSheet';
import { useHealthProfile } from '../hooks/useHealthProfile';
import { useHealthFlags } from '../hooks/useHealthFlags';
import { usePreferences } from '../hooks/usePreferences';

// Placeholders until the real endpoints exist — a support inbox and the store
// listing. Kept as consts so there's one spot to fill in at release.
const FEEDBACK_MAILTO = 'mailto:hello@vajeeva.app?subject=Vajeeva%20feedback';
const RATE_URL = 'https://apps.apple.com/app/vajeeva';

// The "More" tab — a production settings hub (ref: prototypes/explorations/
// vajeeva-profile-production.html). Identity + health up top, then grouped
// About / Support / Account sections. Guests see a conversion banner instead of
// identity, and no account controls. Top inset is owned by the tab layout, so
// the root is a plain View (matches HomeScreen). This surface is the theme
// pilot — it reads the active palette from ThemeContext.
export default function ProfileScreen() {
  const { user, isGuest, logout, updateProfile } = useContext(AuthContext);
  const { codes, save } = useHealthProfile();
  const flags = useHealthFlags();
  const { prefs, setPref } = usePreferences();
  const { colors, mode, setMode } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const [editingHealth, setEditingHealth] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const signedIn = !!user && !isGuest;
  const name = user?.name?.trim();
  const initial = name ? name[0].toUpperCase() : null;
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const labelFor = (code: string) => flags.find(f => f.code === code)?.label ?? code;
  const appearanceLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account and saved recipes from our servers. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try { await usersApi.deleteMe(); } catch { /* sign out regardless */ }
            await logout();
          },
        },
      ],
    );
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sctitle}>Profile</Text>

        {signedIn ? (
          <View style={s.identity}>
            <View style={s.avatar}>
              {initial
                ? <Text style={s.avatarTxt}>{initial}</Text>
                : <IconUser size={sc(24)} color={colors.green} />}
            </View>
            <View style={s.idText}>
              {name ? <Text style={s.idName}>{name}</Text> : null}
              {user?.email ? <Text style={s.idMail}>{user.email}</Text> : null}
            </View>
            <TouchableOpacity
              style={s.idEdit}
              onPress={() => setEditingName(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit name"
              hitSlop={8}
            >
              <IconEdit size={sc(14)} color={colors.ink2} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.guest}>
            <Text style={s.guestH}>Keep your kitchen</Text>
            <Text style={s.guestB}>
              Your saved recipes and health profile live only on this phone. Create an account to
              sync them and never lose them.
            </Text>
            <TouchableOpacity
              style={s.guestCta}
              onPress={() => router.push('/auth/opening' as any)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <IconUser size={sc(14)} color={colors.green} />
              <Text style={s.guestCtaTxt}>Create account or sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Health-profile card */}
        <View style={s.card}>
          <View style={s.cardTop}>
            <Text style={s.cardLabel}>Health profile</Text>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => setEditingHealth(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Edit health profile"
            >
              <IconEdit size={sc(12)} color={colors.green} />
              <Text style={s.editTxt}>Edit</Text>
            </TouchableOpacity>
          </View>
          {codes.length ? (
            <View style={s.chips}>
              {codes.map(code => (
                <View key={code} style={s.chip}>
                  <View style={s.chipDot} />
                  <Text style={s.chipTxt}>{labelFor(code)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.empty}>No conditions set yet — add any that apply.</Text>
          )}
        </View>

        {/* Preferences */}
        <Text style={s.dslabel}>Preferences</Text>
        <SettingsGroup>
          <SettingsRow
            icon={<IconRuler size={sc(15)} color={colors.ink} />}
            label="Units"
            value={prefs.units === 'cup' ? 'Cups' : 'Grams'}
            onPress={() => setUnitsOpen(true)}
          />
          <SettingsRow
            icon={<IconTheme size={sc(15)} color={colors.ink} />}
            label="Appearance"
            value={appearanceLabel}
            onPress={() => setAppearanceOpen(true)}
          />
          <SettingsRow
            icon={<IconSun size={sc(15)} color={colors.ink} />}
            label="Keep screen awake cooking"
            right={<SettingsToggle value={prefs.keepAwake} onValueChange={v => setPref('keepAwake', v)} />}
          />
        </SettingsGroup>

        {/* About & trust */}
        <Text style={s.dslabel}>About &amp; trust</Text>
        <SettingsGroup>
          <SettingsRow
            icon={<IconLeaf size={sc(15)} color={colors.ink} />}
            label="Our sources & method"
            onPress={() => router.push('/sources' as any)}
          />
          <SettingsRow
            icon={<IconShield size={sc(15)} color={colors.ink} />}
            label="Medical disclaimer"
            onPress={() => router.push('/disclaimer' as any)}
          />
          <SettingsRow
            icon={<IconInfo size={sc(15)} color={colors.ink} />}
            label="About Vajeeva"
            onPress={() => router.push('/about' as any)}
          />
          <SettingsRow
            icon={<IconDoc size={sc(15)} color={colors.ink} />}
            label="Privacy Policy"
            onPress={() => router.push('/privacy' as any)}
          />
          <SettingsRow
            icon={<IconDoc size={sc(15)} color={colors.ink} />}
            label="Terms of Service"
            onPress={() => router.push('/terms' as any)}
          />
        </SettingsGroup>

        {/* Support */}
        <Text style={s.dslabel}>Support</Text>
        <SettingsGroup>
          <SettingsRow
            icon={<IconChat size={sc(15)} color={colors.ink} />}
            label="Send feedback"
            onPress={() => Linking.openURL(FEEDBACK_MAILTO)}
          />
          <SettingsRow
            icon={<IconStar size={sc(15)} color={colors.ink} />}
            label="Rate Vajeeva"
            onPress={() => Linking.openURL(RATE_URL)}
          />
        </SettingsGroup>

        {/* Account — signed-in only */}
        {signedIn ? (
          <>
            <Text style={s.dslabel}>Account</Text>
            <SettingsGroup>
              <SettingsRow
                danger
                icon={<IconLogout size={sc(15)} color={colors.clay} />}
                label="Sign out"
                onPress={logout}
              />
              <SettingsRow
                danger
                icon={<IconTrash size={sc(15)} color={colors.clay} />}
                label="Delete account"
                onPress={onDeleteAccount}
              />
            </SettingsGroup>
          </>
        ) : null}

        <Text style={s.version}>Vajeeva v{version}</Text>
      </ScrollView>

      <HealthProfileSheet
        visible={editingHealth}
        codes={codes}
        onSave={save}
        onClose={() => setEditingHealth(false)}
      />
      {signedIn ? (
        <NameEditSheet
          visible={editingName}
          name={name ?? ''}
          onSave={n => updateProfile({ name: n })}
          onClose={() => setEditingName(false)}
        />
      ) : null}

      <ChoiceSheet
        visible={unitsOpen}
        title="Units"
        selected={prefs.units}
        options={[
          { value: 'g', label: 'Grams', hint: 'Metric weights' },
          { value: 'cup', label: 'Cups', hint: 'Volume measures' },
        ]}
        onSelect={v => setPref('units', v)}
        onClose={() => setUnitsOpen(false)}
      />

      <ChoiceSheet<ThemeMode>
        visible={appearanceOpen}
        title="Appearance"
        selected={mode}
        options={[
          { value: 'system', label: 'System', hint: 'Match your device' },
          { value: 'light', label: 'Light', hint: 'Always light' },
          { value: 'dark', label: 'Dark', hint: 'Always dark' },
        ]}
        onSelect={setMode}
        onClose={() => setAppearanceOpen(false)}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  scroll: { paddingBottom: 28 },
  sctitle: {
    fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, letterSpacing: -0.2,
    color: colors.ink, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2,
  },

  // identity
  identity: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.cream,
    borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 12,
    marginHorizontal: 14, marginTop: 8, ...shadows.card,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenSoft,
    borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarTxt: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 22, color: colors.green },
  idText: { flex: 1, minWidth: 0 },
  idName: { fontSize: 14.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink },
  idMail: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink2, marginTop: 2 },
  idEdit: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sand,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // guest banner
  guest: {
    backgroundColor: colors.green, borderRadius: 16, padding: 14,
    marginHorizontal: 14, marginTop: 8, ...shadows.card,
  },
  guestH: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 15, color: colors.onGreen },
  guestB: { fontSize: 11, fontFamily: fonts.sans, color: colors.onGreen, opacity: 0.9, lineHeight: 16, marginTop: 4 },
  guestCta: {
    marginTop: 11, backgroundColor: colors.onGreen, borderRadius: 12, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  guestCtaTxt: { fontSize: 12, fontFamily: fonts.sans, fontWeight: '800', color: colors.green },

  // health card
  card: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 14, padding: 12, marginHorizontal: 14, marginTop: 12, ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.72,
    textTransform: 'uppercase', color: colors.labelFaint,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editTxt: { fontSize: 11, fontFamily: fonts.sans, fontWeight: '800', color: colors.green },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.greenSoft,
    borderWidth: 1, borderColor: 'rgba(62,107,79,0.28)', borderRadius: 999,
    paddingVertical: 5, paddingHorizontal: 11,
  },
  chipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.clay, opacity: 0.75 },
  chipTxt: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.ink },
  empty: {
    fontSize: 10.5, fontFamily: fonts.serifItalic, fontStyle: 'italic',
    color: colors.muted, marginTop: 10, lineHeight: 15,
  },

  // sections
  dslabel: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.72,
    textTransform: 'uppercase', color: colors.labelFaint, paddingHorizontal: 18, marginTop: 17, marginBottom: 8,
  },
  version: {
    fontSize: 9, fontFamily: fonts.mono, color: colors.muted, textAlign: 'center',
    letterSpacing: 0.4, marginTop: 18,
  },
});
