# Vajeeva Frontend UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `apps/mobile` → `apps/frontend`, wire Expo Router, and implement pixel-perfect UI matching `prototypes/vajeeva-prototype.html` (mobile) and `prototypes/vajeeva-desktop.html` (desktop web).

**Architecture:** Single Expo 54 project serving iOS, Android, and Web from one codebase. `useIsDesktop()` hook (768px breakpoint) switches between bottom TabBar and left Sidebar chrome. All screen content components are layout-agnostic; only `(tabs)/_layout.tsx` branches on the hook. All colours/spacing in `src/theme/tokens.ts`.

**Tech Stack:** Expo 54, Expo Router (file-based), React Native, `@expo-google-fonts/libre-baskerville`, `react-native-mmkv`, `@react-native-community/netinfo`, React Native Gesture Handler + Reanimated (swipe in cook mode)

**Spec:** `docs/superpowers/specs/2026-08-21-vajeeva-ui-implementation-design.md`

## Global Constraints

- Breakpoint: 768px (`useWindowDimensions`)
- Colors exact hex per spec §3 — no approximations
- Fonts: `IowanOldStyle` on iOS (system, no load), `LibreBaskerville` via `@expo-google-fonts` on Android+Web
- Expo Router file structure exactly as spec §4
- All existing `src/api.ts` and `src/auth/` logic carried over (import paths only change)
- Admin tests (17/17) must remain green — this plan does not touch `apps/admin`
- Every component file ≤ 200 lines; split if longer

---

### Task 1: Rename `apps/mobile` → `apps/frontend` and install Expo Router

**Files:**
- Modify: `vajeeva/package.json` (workspace path)
- Modify: `vajeeva/turbo.json` (pipeline references if any)
- Modify: `vajeeva/apps/frontend/package.json` (name field)
- Create: `vajeeva/apps/frontend/app/_layout.tsx`
- Create: `vajeeva/apps/frontend/app/(tabs)/_layout.tsx`
- Create: `vajeeva/apps/frontend/app/(tabs)/index.tsx` (stub)
- Create: `vajeeva/apps/frontend/app/(tabs)/saved.tsx` (stub)
- Create: `vajeeva/apps/frontend/app/(tabs)/more.tsx` (stub)

**Interfaces:**
- Produces: working Expo Router shell; `npx expo start --web` renders at least a blank `(tabs)/index` page

- [ ] **Step 1: Rename the directory**

```bash
cd vajeeva
mv apps/mobile apps/frontend
```

- [ ] **Step 2: Update workspace config**

In `vajeeva/package.json`, change `"apps/mobile"` → `"apps/frontend"` in the `workspaces` array.

- [ ] **Step 3: Update `apps/frontend/package.json` name**

Change `"name": "mobile"` → `"name": "frontend"` (or whatever the current name is).

- [ ] **Step 4: Install Expo Router**

```bash
cd vajeeva/apps/frontend
npx expo install expo-router @expo/metro-runtime
```

- [ ] **Step 5: Set entry point in `package.json`**

Add/update `"main": "expo-router/entry"` in `apps/frontend/package.json`.

- [ ] **Step 6: Create root `app/_layout.tsx`**

```tsx
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
  LibreBaskerville_400Regular_Italic,
} from '@expo-google-fonts/libre-baskerville';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(
    Platform.OS === 'ios'
      ? {}  // IowanOldStyle is system font on iOS
      : {
          LibreBaskerville_400Regular,
          LibreBaskerville_700Bold,
          LibreBaskerville_400Regular_Italic,
        }
  );

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <Slot />;
}
```

- [ ] **Step 7: Create `(tabs)/_layout.tsx` stub**

```tsx
import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return <Tabs />;
}
```

- [ ] **Step 8: Create tab screen stubs**

`app/(tabs)/index.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function HomeScreen() {
  return <View><Text>Home</Text></View>;
}
```

`app/(tabs)/saved.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function SavedScreen() {
  return <View><Text>Saved</Text></View>;
}
```

`app/(tabs)/more.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function MoreScreen() {
  return <View><Text>More</Text></View>;
}
```

- [ ] **Step 9: Verify it builds**

```bash
cd vajeeva/apps/frontend
npx expo start --web --no-dev
```

Expected: browser opens, tabs render (blank content OK at this stage).

- [ ] **Step 10: Commit**

```bash
git add vajeeva/
git commit -m "feat: rename apps/mobile → apps/frontend, wire Expo Router shell"
```

---

### Task 2: Token layer

**Files:**
- Create: `vajeeva/apps/frontend/src/theme/tokens.ts`
- Modify: `vajeeva/apps/frontend/src/theme.ts` → re-export from tokens (keep old import paths working during migration)

**Interfaces:**
- Produces: `import { colors, fonts, spacing, shadows } from '../theme/tokens'`

- [ ] **Step 1: Write `src/theme/tokens.ts`**

```ts
import { Platform } from 'react-native';

export const colors = {
  bone:       '#F2EDE1',
  sand:       '#E9E1D0',
  cream:      '#FBF8F1',
  ink:        '#2A251E',
  ink2:       '#6E6656',
  muted:      '#9C9482',
  line:       '#E5DDCC',
  line2:      '#D8CEBA',
  green:      '#3E6B4F',
  greenPress: '#335B42',
  greenSoft:  '#E4EDE3',
  onGreen:    '#FBF8F1',
  amber:      '#C6902F',
  amber2:     '#A9701F',
  amberSoft:  '#F4E8CE',
  clay:       '#B4472E',
  claySoft:   '#F3E1D8',
  blue:       '#3B6BA0',
  blueBg:     '#E8F0FA',
  cmBg:       '#1A1814',
  cmSurf:     '#26221C',
  cmSurf2:    '#302B24',
  cmText:     '#F0EAD8',
  cmMuted:    'rgba(240,234,216,0.42)',
  cmLine:     'rgba(240,234,216,0.08)',
  cmAmber:    '#C6902F',
  cmGreen:    '#5CAD78',
  cmGreenDim: 'rgba(92,173,120,0.15)',
} as const;

export const fonts = {
  // iOS: IowanOldStyle is a system font — no load needed
  // Android + Web: LibreBaskerville loaded in _layout.tsx
  serif: Platform.OS === 'ios' ? 'IowanOldStyle' : 'LibreBaskerville_400Regular',
  serifBold: Platform.OS === 'ios' ? 'IowanOldStyle' : 'LibreBaskerville_700Bold',
  serifItalic: Platform.OS === 'ios' ? 'IowanOldStyle-Italic' : 'LibreBaskerville_400Regular_Italic',
  mono: 'SpaceMono',
  sans: 'System',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 14, lg: 18, xl: 24,
} as const;

export const shadows = {
  card: {
    shadowColor: '#2A251E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  lift: {
    shadowColor: '#2A251E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 28,
    elevation: 6,
  },
} as const;
```

- [ ] **Step 2: Make old `src/theme.ts` re-export**

```ts
// Legacy re-export — new code imports from './theme/tokens' directly
export * from './theme/tokens';
```

- [ ] **Step 3: Install google fonts package**

```bash
cd vajeeva/apps/frontend
npx expo install @expo-google-fonts/libre-baskerville expo-font
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd vajeeva/apps/frontend
npx tsc --noEmit
```

Expected: 0 errors (ignoring any pre-existing errors from old files).

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/frontend/src/theme/
git commit -m "feat: add token layer (colors, fonts, spacing, shadows)"
```

---

### Task 3: `useIsDesktop` hook + layout chrome (TabBar + Sidebar)

**Files:**
- Create: `src/hooks/useIsDesktop.ts`
- Create: `src/components/layout/TabBar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Produces: `useIsDesktop(): boolean`
- Produces: `<TabBar />`, `<Sidebar />`
- Consumes: `colors`, `fonts`, `spacing` from tokens

- [ ] **Step 1: Write `useIsDesktop.ts`**

```ts
import { useWindowDimensions } from 'react-native';
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= 768;
}
```

- [ ] **Step 2: Write `TabBar.tsx`** (mobile bottom nav, spec §5 HomeScreen table)

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../../theme/tokens';

const TABS = [
  { href: '/', label: 'Home',  icon: '⌂' },
  { href: '/saved', label: 'Saved', icon: '♡' },
  { href: '/more',  label: 'More',  icon: '≡' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View style={s.bar}>
      {TABS.map(tab => {
        const active = pathname === tab.href || (tab.href === '/' && pathname === '/index');
        return (
          <TouchableOpacity
            key={tab.href}
            style={s.item}
            onPress={() => router.push(tab.href as any)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.icon, active && s.activeIcon]}>{tab.icon}</Text>
            <Text style={[s.label, active && s.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingBottom: 20, // safe area approximation; use useSafeAreaInsets in production
  },
  item: { flex: 1, alignItems: 'center', paddingTop: 10 },
  icon: { fontSize: 20, color: colors.muted },
  activeIcon: { color: colors.green },
  label: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.muted, marginTop: 2 },
  activeLabel: { color: colors.green },
});
```

- [ ] **Step 3: Write `Sidebar.tsx`** (desktop, spec §6 table)

```tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../../theme/tokens';

const NAV = [
  { href: '/',      label: 'Home' },
  { href: '/saved', label: 'Saved' },
  { href: '/more',  label: 'Settings' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View style={s.sidebar}>
      {/* Logo */}
      <View style={s.logo}>
        <View style={s.logoMark}><Text style={s.logoV}>V</Text></View>
        <View>
          <Text style={s.brand}>Vajeeva</Text>
        </View>
      </View>
      {/* Nav */}
      {NAV.map(item => {
        const active = pathname === item.href;
        return (
          <TouchableOpacity
            key={item.href}
            style={[s.navItem, active && s.navActive]}
            onPress={() => router.push(item.href as any)}
          >
            <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.sand,
    borderRightWidth: 1,
    borderRightColor: colors.line,
    paddingTop: 24,
    paddingHorizontal: spacing.md,
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
  },
  logoV: { color: colors.onGreen, fontSize: 16, fontFamily: fonts.serif, fontWeight: '700' },
  brand: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  navItem: {
    paddingVertical: 9, paddingHorizontal: spacing.sm,
    borderRadius: 9, marginBottom: 2,
  },
  navActive: { backgroundColor: colors.green },
  navLabel: { fontSize: 14, fontFamily: fonts.sans, color: colors.ink2 },
  navLabelActive: { color: colors.onGreen, fontWeight: '600' },
});
```

- [ ] **Step 4: Wire `(tabs)/_layout.tsx` to branch on `useIsDesktop`**

```tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useIsDesktop } from '../../src/hooks/useIsDesktop';
import { TabBar } from '../../src/components/layout/TabBar';
import { Sidebar } from '../../src/components/layout/Sidebar';

export default function TabsLayout() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    // Desktop: sidebar layout — Expo Router Tabs still handles routing,
    // we hide the default tab bar and render Sidebar separately.
    return (
      <View style={s.shell}>
        <Sidebar />
        <View style={s.main}>
          <Tabs
            tabBar={() => null}
            screenOptions={{ headerShown: false }}
          />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      tabBar={props => <TabBar />}
      screenOptions={{ headerShown: false }}
    />
  );
}

const s = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
});
```

- [ ] **Step 5: Test layout switching**

Run `npx expo start --web`, open browser. Resize window:
- < 768px: bottom tab bar visible, sidebar hidden
- ≥ 768px: sidebar at left, bottom bar gone

Run `npx expo start` on simulator: bottom tab bar only.

- [ ] **Step 6: Commit**

```bash
git add vajeeva/apps/frontend/src/
git commit -m "feat: useIsDesktop hook + TabBar + Sidebar; layout branches at 768px"
```

---

### Task 4: Shared atomic components

**Files:**
- Create: `src/components/shared/SectionLabel.tsx`
- Create: `src/components/shared/IconButton.tsx`
- Create: `src/components/shared/CTA.tsx`
- Create: `src/components/shared/GhostButton.tsx`
- Create: `src/components/shared/Disclaimer.tsx`
- Create: `src/components/shared/FilterChip.tsx`
- Create: `src/components/shared/SearchBar.tsx`
- Create: `src/components/shared/OfflineBadge.tsx`
- Create: `src/components/shared/ContraDots.tsx`

**Interfaces:**
- `SectionLabel({ label: string })` → rendered mono-caps label at 28% ink opacity
- `IconButton({ icon: string, onPress: () => void, size?: number })` → 34×34 cream circle
- `CTA({ label: string, onPress: () => void, icon?: string })` → full-width green button
- `GhostButton({ label: string, onPress: () => void })` → centred ink2 text button
- `Disclaimer({ text: string })` → 9.5px muted centred
- `FilterChip({ label: string, active: boolean, onPress: () => void, safeForMe?: boolean })`
- `SearchBar({ placeholder?: string, value: string, onChangeText: (t: string) => void })`
- `OfflineBadge()` → sand pill with leaf + "Offline"
- `ContraDots({ count: number })` → up to 4 × 5px clay circles

- [ ] **Step 1: Write all atomic components**

`SectionLabel.tsx`:
```tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function SectionLabel({ label }: { label: string }) {
  return <Text style={s.t}>{label.toUpperCase()}</Text>;
}
const s = StyleSheet.create({
  t: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.1,
    color: colors.ink, opacity: 0.28, marginBottom: 6,
  },
});
```

`IconButton.tsx`:
```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '../../theme/tokens';
export function IconButton({ icon, onPress, size = 34, style }: {
  icon: string; onPress: () => void; size?: number; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[s.btn, { width: size, height: size, borderRadius: size / 2 }, style]}
      onPress={onPress}
    >
      <Text style={s.icon}>{icon}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  icon: { fontSize: 16, color: colors.ink },
});
```

`CTA.tsx`:
```tsx
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function CTA({ label, onPress, icon }: {
  label: string; onPress: () => void; icon?: string;
}) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.85}>
      <View style={s.row}>
        {icon ? <Text style={s.icon}>{icon}</Text> : null}
        <Text style={s.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16, color: colors.onGreen },
  label: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '800', color: colors.onGreen },
});
```

`GhostButton.tsx`:
```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress}>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  btn: { alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 14, fontFamily: fonts.sans, color: colors.ink2 },
});
```

`Disclaimer.tsx`:
```tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function Disclaimer({ text }: { text: string }) {
  return <Text style={s.t}>{text}</Text>;
}
const s = StyleSheet.create({
  t: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', lineHeight: 13 },
});
```

`FilterChip.tsx`:
```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';
export function FilterChip({ label, active, onPress, safeForMe }: {
  label: string; active: boolean; onPress: () => void; safeForMe?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.chip, active && s.active, safeForMe && s.safeChip]}
      onPress={onPress}
    >
      <Text style={[s.label, active && s.activeLabel, safeForMe && s.safeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    borderWidth: 1, borderColor: colors.line2, marginRight: spacing.sm,
  },
  active: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  safeChip: { borderColor: colors.green },
  label: { fontSize: 10.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  activeLabel: { color: colors.green },
  safeLabel: { color: colors.green },
});
```

`SearchBar.tsx`:
```tsx
import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
export function SearchBar({ placeholder = 'Search recipes…', value, onChangeText }: {
  placeholder?: string; value: string; onChangeText: (t: string) => void;
}) {
  return (
    <View style={s.bar}>
      <Text style={s.icon}>🔍</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.cream, borderRadius: 99,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 12, paddingVertical: 9,
    ...shadows.card,
  },
  icon: { fontSize: 13, opacity: 0.5 },
  input: { flex: 1, fontSize: 11.5, fontFamily: fonts.sans, color: colors.ink },
});
```

`OfflineBadge.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function OfflineBadge() {
  return (
    <View style={s.pill}>
      <Text style={s.icon}>🌿</Text>
      <Text style={s.label}>Offline</Text>
    </View>
  );
}
const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.sand, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  icon: { fontSize: 10 },
  label: { fontSize: 9.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
});
```

`ContraDots.tsx`:
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';
export function ContraDots({ count }: { count: number }) {
  const dots = Math.min(count, 4);
  if (dots === 0) return null;
  return (
    <View style={s.row}>
      {Array.from({ length: dots }).map((_, i) => (
        <View key={i} style={s.dot} />
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2.5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.clay, opacity: 0.65 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd vajeeva/apps/frontend
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add vajeeva/apps/frontend/src/components/shared/
git commit -m "feat: shared atomic components (SectionLabel, CTA, FilterChip, SearchBar, etc.)"
```

---

### Task 5: RecipeCard + TexturePillar + ContinueCookingCard

**Files:**
- Create: `src/components/shared/RecipeCard.tsx`
- Create: `src/components/shared/TexturePillar.tsx`
- Create: `src/components/shared/ContinueCookingCard.tsx`

**Interfaces:**
- `RecipeCard({ recipe: RecipeListItem, onPress: () => void })` → cream card with tile, name, Tamil name, meta, contra dots, chevron
- `TexturePillar({ name: string, subtitle: string, count: number, onPress: () => void })` → cream pillar card
- `ContinueCookingCard({ recipe: RecipeListItem, currentStep: number, totalSteps: number, onPress: () => void })`
- Consumes: `Recipe` from `src/api/recipes.ts`

- [ ] **Step 1: Define `RecipeListItem` type** in `src/api/recipes.ts` (add if not present)

```ts
export interface RecipeListItem {
  slug: string;
  nameEn: string;
  nameTa?: string;
  category: string;
  cookTimeMin: number;
  contraCount: number;  // number of active contra conditions for current user
  // existing fields carry forward
}
```

- [ ] **Step 2: Write `RecipeCard.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from '../../theme/tokens';
import { ContraDots } from './ContraDots';
import type { RecipeListItem } from '../../api/recipes';

export function RecipeCard({ recipe, onPress }: { recipe: RecipeListItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      {/* Texture tile */}
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        {recipe.nameTa ? <Text style={s.tamil}>{recipe.nameTa}</Text> : null}
        <Text style={s.meta}>{recipe.category} · {recipe.cookTimeMin}m</Text>
      </View>
      <View style={s.right}>
        {recipe.contraCount > 0 && <ContraDots count={recipe.contraCount} />}
        <Text style={s.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cream, borderRadius: 15,
    padding: spacing.md, marginBottom: 8,
    ...shadows.card,
  },
  tile: {
    width: 50, height: 50, borderRadius: 10,
    backgroundColor: colors.sand, marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: 13.5, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  tamil: { fontSize: 10, fontFamily: fonts.serifItalic, color: colors.amber, marginTop: 1 },
  meta: { fontSize: 9, fontFamily: fonts.sans, color: colors.muted, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  chevron: { fontSize: 18, color: colors.muted, opacity: 0.5 },
});
```

- [ ] **Step 3: Write `TexturePillar.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from '../../theme/tokens';

export function TexturePillar({ name, subtitle, count, onPress }: {
  name: string; subtitle: string; count: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{name}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <Text style={s.count}>{count} recipes</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cream, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    padding: spacing.md, marginBottom: 10,
    ...shadows.card,
  },
  tile: { width: 54, height: 54, borderRadius: 12, backgroundColor: colors.amberSoft, marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2, marginTop: 2 },
  count: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted, marginTop: 3 },
  chevron: { fontSize: 18, color: colors.muted, opacity: 0.5 },
});
```

- [ ] **Step 4: Write `ContinueCookingCard.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';
import type { RecipeListItem } from '../../api/recipes';

export function ContinueCookingCard({ recipe, currentStep, totalSteps, onPress }: {
  recipe: RecipeListItem; currentStep: number; totalSteps: number; onPress: () => void;
}) {
  const progress = currentStep / totalSteps;
  return (
    <View style={s.card}>
      <View style={s.tile} />
      <View style={s.info}>
        <Text style={s.name}>{recipe.nameEn}</Text>
        <Text style={s.step}>Step {currentStep} of {totalSteps}</Text>
        <View style={s.track}>
          <View style={[s.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
        </View>
      </View>
      <TouchableOpacity style={s.play} onPress={onPress}>
        <Text style={s.playIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.green, borderRadius: 14,
    padding: spacing.md, marginBottom: 16,
  },
  tile: { width: 38, height: 38, borderRadius: 8, backgroundColor: colors.greenPress, marginRight: spacing.md },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: fonts.serif, fontWeight: '700', color: colors.onGreen },
  step: { fontSize: 10, fontFamily: fonts.sans, color: colors.onGreen, opacity: 0.8, marginTop: 2 },
  track: { height: 3, backgroundColor: 'rgba(251,248,241,0.25)', borderRadius: 2, marginTop: 6 },
  fill: { height: 3, backgroundColor: colors.onGreen, borderRadius: 2 },
  play: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.onGreen, alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 10, color: colors.green, marginLeft: 2 },
});
```

- [ ] **Step 5: Commit**

```bash
git add vajeeva/apps/frontend/src/components/shared/
git commit -m "feat: RecipeCard, TexturePillar, ContinueCookingCard components"
```

---

### Task 6: HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx` (full rewrite)
- Modify: `app/(tabs)/index.tsx` → import HomeScreen

**Interfaces:**
- Consumes: `SearchBar`, `ContinueCookingCard`, `TexturePillar`, `SectionLabel` from shared
- Consumes: `useIsDesktop`, `useCookSession` (Task 10), `recipesApi.list()` from api
- Produces: pixel-perfect home screen matching spec §5 HomeScreen table

- [ ] **Step 1: Rewrite `src/screens/HomeScreen.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { SearchBar } from '../components/shared/SearchBar';
import { TexturePillar } from '../components/shared/TexturePillar';
import { SectionLabel } from '../components/shared/SectionLabel';

const PILLARS = [
  { key: 'solid',  name: 'Solid Foods',  subtitle: 'Grains, lentils & vegetables', count: 24 },
  { key: 'liquid', name: 'Liquids',       subtitle: 'Broths, rasams & tonics',      count: 11 },
  { key: 'semi',   name: 'Semi-solid',    subtitle: 'Porridges, purees & chutneys', count: 16 },
] as const;

export function HomeScreen() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo row */}
        <View style={s.logoRow}>
          <View style={s.logoMark}><Text style={s.logoV}>V</Text></View>
          <Text style={s.greeting}>Good morning · Vajeeva</Text>
          <View style={s.avatar}><Text style={s.avatarInitial}>R</Text></View>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>

        {/* Section heading */}
        <Text style={s.heading}>What would you like today?</Text>

        {/* Texture pillars */}
        {PILLARS.map(p => (
          <TexturePillar
            key={p.key}
            name={p.name}
            subtitle={p.subtitle}
            count={p.count}
            onPress={() => router.push(`/recipe-list?texture=${p.key}` as any)}
          />
        ))}

        {/* Trust badge */}
        <View style={s.trust}>
          <Text style={s.trustText}>🌿 grounded in classical texts · ICMR-NIN 2024</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md,
  },
  logoMark: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoV: { fontSize: 14, fontFamily: fonts.serif, fontWeight: '700', color: colors.green },
  greeting: {
    flex: 1, fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 13, fontFamily: fonts.sans, fontWeight: '700', color: colors.ink2 },
  searchWrap: { marginBottom: spacing.lg },
  heading: {
    fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink,
    marginBottom: spacing.md,
  },
  trust: { marginTop: 20, alignItems: 'center' },
  trustText: { fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
});
```

- [ ] **Step 2: Update `app/(tabs)/index.tsx` to use HomeScreen**

```tsx
import { HomeScreen } from '../../src/screens/HomeScreen';
export default HomeScreen;
```

- [ ] **Step 3: Run on simulator and browser, verify layout**

```bash
cd vajeeva/apps/frontend
npx expo start
```

Verify: pillars visible, search bar renders, trust badge at bottom.

- [ ] **Step 4: Commit**

```bash
git add vajeeva/apps/frontend/
git commit -m "feat: HomeScreen pixel-perfect — pillars, search, greeting, trust badge"
```

---

### Task 7: RecipeListScreen + route stubs

**Files:**
- Create: `src/screens/RecipeListScreen.tsx`
- Create: `app/recipe-list.tsx`
- Create: `app/recipe/[slug].tsx` (stub)
- Create: `app/cook/[slug].tsx` (stub)
- Create: `app/finish/[slug].tsx` (stub)
- Create: `app/source/[slug].tsx` (stub)

**Interfaces:**
- Consumes: `RecipeCard`, `FilterChip`, `IconButton` from shared
- Consumes: `recipesApi.list()` from api

- [ ] **Step 1: Write `RecipeListScreen.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, ScrollView, Text, StyleSheet,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { RecipeCard } from '../components/shared/RecipeCard';
import { FilterChip } from '../components/shared/FilterChip';
import { IconButton } from '../components/shared/IconButton';
import { recipesApi } from '../api/recipes';
import type { RecipeListItem } from '../api/recipes';

const FILTERS = ['All', 'Solid', 'Liquid', 'Semi-solid'];

export function RecipeListScreen() {
  const router = useRouter();
  const { texture } = useLocalSearchParams<{ texture?: string }>();
  const [filter, setFilter] = useState(texture ?? 'All');
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await recipesApi.list();
      setRecipes(filter === 'All' ? all : all.filter(r => r.category.toLowerCase() === filter.toLowerCase()));
    } catch {}
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <IconButton icon="←" onPress={() => router.back()} />
        <Text style={s.title}>{filter === 'All' ? 'All Recipes' : filter}</Text>
        <Text style={s.count}>{recipes.length} recipes</Text>
      </View>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
        {FILTERS.map(f => (
          <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
        <FilterChip label="🛡 Safe for me" active={false} onPress={() => {}} safeForMe />
      </ScrollView>
      {/* List */}
      <FlatList
        data={recipes}
        keyExtractor={r => r.slug}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.slug}`)} />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  count: { fontSize: 11, fontFamily: fonts.sans, color: colors.muted },
  chips: { paddingLeft: spacing.lg, marginBottom: spacing.sm },
  chipsContent: { paddingRight: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
});
```

- [ ] **Step 2: Wire `app/recipe-list.tsx`**

```tsx
import { RecipeListScreen } from '../src/screens/RecipeListScreen';
export default RecipeListScreen;
```

- [ ] **Step 3: Create stub routes**

`app/recipe/[slug].tsx`:
```tsx
import { View, Text } from 'react-native';
export default function RecipeDetail() { return <View><Text>Recipe Detail</Text></View>; }
```

`app/cook/[slug].tsx`:
```tsx
import { View, Text } from 'react-native';
export default function CookMode() { return <View style={{ flex:1, backgroundColor:'#1A1814' }}><Text style={{color:'#F0EAD8'}}>Cook Mode</Text></View>; }
```

`app/finish/[slug].tsx`:
```tsx
import { View, Text } from 'react-native';
export default function Finish() { return <View style={{ flex:1, backgroundColor:'#1A1814' }}><Text style={{color:'#F0EAD8'}}>Finish</Text></View>; }
```

`app/source/[slug].tsx`:
```tsx
import { View, Text } from 'react-native';
export default function SourceGlossary() { return <View><Text>Source</Text></View>; }
```

- [ ] **Step 4: Commit**

```bash
git add vajeeva/apps/frontend/
git commit -m "feat: RecipeListScreen + route stubs (recipe, cook, finish, source)"
```

---

### Task 8: RecipeDetailScreen + ContraCard + IngredientTable + StepList + SourcePill

**Files:**
- Create: `src/components/shared/ContraCard.tsx`
- Create: `src/components/shared/IngredientTable.tsx`
- Create: `src/components/shared/StepList.tsx`
- Create: `src/components/shared/SourcePill.tsx`
- Create: `src/screens/RecipeDetailScreen.tsx`
- Modify: `app/recipe/[slug].tsx`

**Interfaces:**
- `ContraCard({ conditions: string[] })` → clay-bordered caution card
- `IngredientTable({ ingredients: Ingredient[], unit: 'g' | 'cup' })` → alternating rows
- `StepList({ steps: Step[] })` → numbered green circles
- `SourcePill({ name: string, onPress: () => void })` → amber dashed italic button

- [ ] **Step 1: Write `ContraCard.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';
export function ContraCard({ conditions }: { conditions: string[] }) {
  if (conditions.length === 0) return null;
  return (
    <View style={s.card}>
      <Text style={s.header}>⚠ USE WITH CAUTION</Text>
      {conditions.map(c => (
        <Text key={c} style={s.item}>• {c}</Text>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(180,71,46,0.07)',
    borderLeftWidth: 3, borderLeftColor: colors.clay,
    borderRadius: 6, padding: spacing.md, marginBottom: 16,
  },
  header: {
    fontSize: 9, fontFamily: fonts.sans, fontWeight: '700',
    color: colors.clay, letterSpacing: 0.06, marginBottom: 6,
  },
  item: { fontSize: 10, fontFamily: fonts.sans, color: `${colors.clay}D6`, marginBottom: 3 },
});
```

- [ ] **Step 2: Write `IngredientTable.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export interface Ingredient {
  name: string;
  amountG: number;
  amountCup?: string;
  stage?: string; // if set, this row is a stage header
}

export function IngredientTable({ ingredients, unit }: {
  ingredients: Ingredient[]; unit: 'g' | 'cup';
}) {
  return (
    <View>
      {ingredients.map((ing, i) => {
        if (ing.stage) {
          return (
            <Text key={i} style={s.stage}>{ing.stage.toUpperCase()}</Text>
          );
        }
        const amount = unit === 'g' ? `${ing.amountG}g` : (ing.amountCup ?? `${ing.amountG}g`);
        return (
          <View key={i} style={[s.row, i % 2 === 1 && s.odd]}>
            <Text style={s.name}>{ing.name}</Text>
            <Text style={s.amount}>{amount}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8 },
  odd: { backgroundColor: `${colors.sand}73` }, // 45% tint
  stage: {
    fontSize: 8, fontFamily: fonts.mono, fontWeight: '700',
    color: colors.amber, letterSpacing: 0.1, paddingVertical: 6, paddingHorizontal: 8,
  },
  name: { flex: 1, fontSize: 11, fontFamily: fonts.sans, color: colors.ink },
  amount: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2 },
});
```

- [ ] **Step 3: Write `StepList.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme/tokens';

export interface Step {
  phase?: string;
  text: string;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <View>
      {steps.map((step, i) => (
        <View key={i} style={s.row}>
          <View style={s.circle}>
            <Text style={s.num}>{i + 1}</Text>
          </View>
          <View style={s.body}>
            {step.phase ? <Text style={s.phase}>{step.phase.toUpperCase()}</Text> : null}
            <Text style={s.text}>{step.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 16 },
  circle: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 2, flexShrink: 0,
  },
  num: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', color: colors.onGreen },
  body: { flex: 1 },
  phase: {
    fontSize: 8, fontFamily: fonts.mono, fontWeight: '700',
    color: colors.amber, letterSpacing: 0.08, marginBottom: 4,
  },
  text: { fontSize: 13, fontFamily: fonts.sans, color: colors.ink, lineHeight: 18 },
});
```

- [ ] **Step 4: Write `SourcePill.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
export function SourcePill({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.pill} onPress={onPress}>
      <Text style={s.label}>{name}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  pill: {
    borderWidth: 1, borderColor: colors.amber, borderStyle: 'dashed',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
  },
  label: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.amber },
});
```

- [ ] **Step 5: Write `RecipeDetailScreen.tsx`** (abbreviated — all sections from spec §5)

```tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing, shadows } from '../theme/tokens';
import { ContraCard } from '../components/shared/ContraCard';
import { IngredientTable } from '../components/shared/IngredientTable';
import { StepList } from '../components/shared/StepList';
import { SourcePill } from '../components/shared/SourcePill';
import { CTA } from '../components/shared/CTA';
import { Disclaimer } from '../components/shared/Disclaimer';
import { SectionLabel } from '../components/shared/SectionLabel';
import { IconButton } from '../components/shared/IconButton';

// ponytail: using placeholder data; replace with recipesApi.get(slug) in real integration
const PLACEHOLDER = {
  nameEn: 'Paavakkai Pitla',
  nameTa: 'பாவக்காய் பிட்லா',
  sources: ['Samayamulu', 'Arogya Padasastra'],
  yield: '2 servings',
  shelfLife: '4h · refrigerate',
  contraConditions: ['Pregnancy — bitter melon stimulates uterine contractions'],
  ingredients: [
    { name: 'Bitter melon', amountG: 150, amountCup: '1 cup' },
    { name: 'Toor dal', amountG: 80, amountCup: '⅓ cup' },
    { stage: 'Seasoning' } as any,
    { name: 'Mustard seeds', amountG: 4, amountCup: '1 tsp' },
  ],
  steps: [
    { phase: 'Prep', text: 'Wash and slice bitter melon into thin rounds. Soak toor dal for 20 minutes.' },
    { phase: 'Cook', text: 'Pressure cook dal until soft. In a pan, temper mustard seeds in oil.' },
  ],
};

export function RecipeDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [unit, setUnit] = useState<'g' | 'cup'>('g');
  const recipe = PLACEHOLDER; // TODO: fetch by slug

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <IconButton icon="←" onPress={() => router.back()} style={s.backBtn} />
        </View>
        <View style={s.body}>
          {/* Title */}
          <Text style={s.title}>{recipe.nameEn}</Text>
          <Text style={s.tamil}>{recipe.nameTa}</Text>

          {/* Sources */}
          <SectionLabel label="Classical Sources" />
          <View style={s.sourceRow}>
            {recipe.sources.map(src => (
              <SourcePill key={src} name={src} onPress={() => router.push(`/source/${src}` as any)} />
            ))}
          </View>

          {/* Yield / shelf */}
          <View style={s.badges}>
            <View style={s.badge}><Text style={s.badgeText}>{recipe.yield}</Text></View>
            <View style={s.badge}><Text style={s.badgeText}>{recipe.shelfLife}</Text></View>
          </View>

          {/* Contra */}
          <ContraCard conditions={recipe.contraConditions} />

          {/* Ingredients */}
          <View style={s.section}>
            <View style={s.ingHeader}>
              <Text style={s.sectionTitle}>Ingredients</Text>
              <View style={s.toggle}>
                {(['g', 'cup'] as const).map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[s.toggleBtn, unit === u && s.toggleActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[s.toggleLabel, unit === u && s.toggleLabelActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <IngredientTable ingredients={recipe.ingredients} unit={unit} />
          </View>

          {/* Method */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Method</Text>
            <StepList steps={recipe.steps} />
          </View>

          {/* CTA */}
          <CTA label="Start Cook Mode" icon="▶" onPress={() => router.push(`/cook/${slug}`)} />
          <Disclaimer text="Consult a qualified practitioner before making dietary changes based on classical Ayurvedic texts." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  hero: {
    height: 172,
    backgroundColor: colors.greenSoft,
    justifyContent: 'flex-end', padding: spacing.md,
  },
  backBtn: { position: 'absolute', top: spacing.lg, left: spacing.md },
  body: { padding: spacing.lg },
  title: { fontSize: 22, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, letterSpacing: -0.01 * 22, marginBottom: 4 },
  tamil: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.amber, marginBottom: spacing.md },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  badge: { backgroundColor: colors.sand, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2 },
  section: { marginBottom: spacing.xl },
  ingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { flex: 1, fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.sand, borderRadius: 8, padding: 2,
  },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleActive: { backgroundColor: colors.green },
  toggleLabel: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink2 },
  toggleLabelActive: { color: colors.onGreen, fontWeight: '700' },
});
```

- [ ] **Step 6: Wire route**

`app/recipe/[slug].tsx`:
```tsx
import { RecipeDetailScreen } from '../../src/screens/RecipeDetailScreen';
export default RecipeDetailScreen;
```

- [ ] **Step 7: Commit**

```bash
git add vajeeva/apps/frontend/src/
git commit -m "feat: RecipeDetailScreen, ContraCard, IngredientTable, StepList, SourcePill"
```

---

### Task 9: CookModeScreen + TimerPill + CookDots

**Files:**
- Create: `src/components/shared/TimerPill.tsx`
- Create: `src/components/shared/CookDots.tsx`
- Create: `src/screens/CookModeScreen.tsx`
- Modify: `app/cook/[slug].tsx`

**Interfaces:**
- `TimerPill({ seconds: number, running: boolean, onToggle: () => void, done: boolean })`
- `CookDots({ total: number, current: number, onJump: (i: number) => void })`

- [ ] **Step 1: Write `TimerPill.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

export function TimerPill({ seconds, running, onToggle, done }: {
  seconds: number; running: boolean; onToggle: () => void; done: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    else if (ref.current) clearInterval(ref.current);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const label = done ? '✓ done' : running ? `⏸ ${fmt(elapsed)}` : elapsed > 0 ? `▶ ${fmt(elapsed)}` : `▶ ${fmt(seconds)}`;
  return (
    <TouchableOpacity style={s.pill} onPress={onToggle} disabled={done}>
      <Text style={[s.label, done && s.done]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    borderWidth: 2, borderColor: colors.cmGreen,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
  },
  label: { fontSize: 12, fontFamily: fonts.mono, color: colors.cmGreen },
  done: { opacity: 0.6 },
});
```

- [ ] **Step 2: Write `CookDots.tsx`**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/tokens';

export function CookDots({ total, current, onJump }: {
  total: number; current: number; onJump: (i: number) => void;
}) {
  return (
    <View style={s.row}>
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        return (
          <TouchableOpacity
            key={i}
            style={[
              s.dot,
              isCurrent && s.current,
              isDone && s.done,
            ]}
            onPress={() => { if (i <= current) onJump(i); }}
            disabled={i > current}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.cmSurf2 },
  current: { width: 20, backgroundColor: colors.cmAmber },
  done: { backgroundColor: colors.cmGreenDim },
});
```

- [ ] **Step 3: Write `CookModeScreen.tsx`**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { TimerPill } from '../components/shared/TimerPill';
import { CookDots } from '../components/shared/CookDots';

// ponytail: placeholder steps; replace with recipesApi.get(slug).steps
const PLACEHOLDER_STEPS = [
  { phase: 'PREP', text: 'Wash and slice bitter melon into thin rounds. Soak toor dal for 20 minutes.', timerSec: 20 * 60 },
  { phase: 'COOK', text: 'Pressure cook dal until soft, about 3 whistles.', timerSec: 8 * 60 },
  { phase: 'SEASON', text: 'Temper mustard seeds in 1 tbsp oil until they splutter.', timerSec: 2 * 60 },
];

export function CookModeScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [step, setStep] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const steps = PLACEHOLDER_STEPS;
  const current = steps[step];

  // Web wake lock
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      let lock: any;
      (navigator as any).wakeLock.request('screen').then((l: any) => { lock = l; }).catch(() => {});
      return () => { lock?.release?.(); };
    }
  }, []);

  const goNext = useCallback(() => {
    if (step >= steps.length - 1) {
      router.replace(`/finish/${slug}`);
    } else {
      setStep(s => s + 1);
      setTimerRunning(false);
      setTimerDone(false);
    }
  }, [step, steps.length, slug]);

  const goPrev = useCallback(() => {
    if (step > 0) { setStep(s => s - 1); setTimerRunning(false); setTimerDone(false); }
  }, [step]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, { dx }) => {
      if (dx < -44) goNext();
      else if (dx > 44) goPrev();
    },
  });

  const progress = (step + 1) / steps.length;

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      {/* Progress bar */}
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>
      <SafeAreaView style={s.safe}>
        {/* Nav bar */}
        <View style={s.navbar}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
          <CookDots total={steps.length} current={step} onJump={setStep} />
          <Text style={s.counter}>{step + 1}/{steps.length}</Text>
        </View>

        {/* Content */}
        <View style={s.content}>
          <Text style={s.phase}>{current.phase}</Text>
          <Text style={s.stepText}>{current.text}</Text>
          <View style={s.illus} />
          <TimerPill
            seconds={current.timerSec}
            running={timerRunning}
            onToggle={() => setTimerRunning(r => !r)}
            done={timerDone}
          />
        </View>

        {/* Footer nav */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.footBtn, s.footPrev, step === 0 && s.footPrevDim]}
            onPress={goPrev}
            disabled={step === 0}
          >
            <Text style={s.footPrevTxt}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.footBtn, s.footNext]} onPress={goNext}>
            <Text style={s.footNextTxt}>{step === steps.length - 1 ? 'Finish ✓' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.caption}>screen stays awake · swipe to navigate · works offline</Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cmBg },
  track: { height: 2, backgroundColor: colors.cmLine },
  fill: { height: 2, backgroundColor: colors.cmAmber },
  safe: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 8,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cmSurf, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 14, color: colors.cmText, opacity: 0.6 },
  counter: { flex: 0, fontSize: 11, fontFamily: fonts.mono, color: colors.cmMuted, marginLeft: 'auto' },
  content: { flex: 1, padding: spacing.lg },
  phase: {
    fontSize: 9, fontFamily: fonts.mono, color: colors.cmAmber,
    letterSpacing: 0.18, marginBottom: spacing.md,
  },
  stepText: {
    fontSize: 20, fontFamily: fonts.serif, fontWeight: '700',
    color: colors.cmText, lineHeight: 28, marginBottom: 24,
  },
  illus: {
    height: 94, borderRadius: 14, backgroundColor: colors.cmSurf,
    marginBottom: 20,
  },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg },
  footBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  footPrev: {
    backgroundColor: colors.cmSurf,
    borderWidth: 1, borderColor: colors.cmLine,
  },
  footPrevDim: { opacity: 0.3 },
  footPrevTxt: { fontSize: 14, fontFamily: fonts.sans, color: colors.cmText, opacity: 0.65 },
  footNext: { backgroundColor: colors.cmGreen },
  footNextTxt: { fontSize: 14, fontFamily: fonts.sans, fontWeight: '700', color: colors.cmBg },
  caption: {
    fontSize: 8, fontFamily: fonts.mono, color: colors.cmMuted,
    textAlign: 'center', marginBottom: spacing.lg,
  },
});
```

- [ ] **Step 4: Wire `app/cook/[slug].tsx`**

```tsx
import { CookModeScreen } from '../../src/screens/CookModeScreen';
export default CookModeScreen;
```

- [ ] **Step 5: Test cook mode**

Run on simulator; tap "Start Cook Mode" from a recipe detail. Verify dark theme, step text, dot nav, swipe gesture, Prev/Next buttons.

- [ ] **Step 6: Commit**

```bash
git add vajeeva/apps/frontend/src/
git commit -m "feat: CookModeScreen, TimerPill, CookDots — dark theme, swipe, wakeLock"
```

---

### Task 10: FinishScreen + SavedScreen + offline storage

**Files:**
- Create: `src/offline/storage.ts`
- Create: `src/hooks/useSavedRecipes.ts`
- Create: `src/screens/FinishScreen.tsx`
- Create: `src/screens/SavedScreen.tsx`
- Modify: `app/finish/[slug].tsx`
- Modify: `app/(tabs)/saved.tsx`

**Interfaces:**
- `storage.ts`: `get<T>(key: string): T | null`, `set<T>(key: string, val: T): void`, `del(key: string): void`
- `useSavedRecipes()`: `{ ids: string[], save(slug): void, unsave(slug): void, isSaved(slug): boolean }`

- [ ] **Step 1: Install MMKV**

```bash
cd vajeeva/apps/frontend
npx expo install react-native-mmkv
```

- [ ] **Step 2: Write `src/offline/storage.ts`**

```ts
import { MMKV } from 'react-native-mmkv';

const store = new MMKV({ id: 'vajeeva' });

export function get<T>(key: string): T | null {
  const v = store.getString(key);
  if (!v) return null;
  try { return JSON.parse(v) as T; } catch { return null; }
}

export function set<T>(key: string, val: T): void {
  store.set(key, JSON.stringify(val));
}

export function del(key: string): void {
  store.delete(key);
}
```

- [ ] **Step 3: Write `useSavedRecipes.ts`**

```ts
import { useState, useCallback } from 'react';
import { get, set } from '../offline/storage';

const KEY = 'savedIds';

function load(): string[] {
  return get<string[]>(KEY) ?? [];
}

export function useSavedRecipes() {
  const [ids, setIds] = useState<string[]>(load);

  const save = useCallback((slug: string) => {
    const next = [...new Set([...ids, slug])];
    set(KEY, next);
    setIds(next);
  }, [ids]);

  const unsave = useCallback((slug: string) => {
    const next = ids.filter(id => id !== slug);
    set(KEY, next);
    setIds(next);
  }, [ids]);

  const isSaved = useCallback((slug: string) => ids.includes(slug), [ids]);

  return { ids, save, unsave, isSaved };
}
```

- [ ] **Step 4: Write `FinishScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { CTA } from '../components/shared/CTA';
import { GhostButton } from '../components/shared/GhostButton';
import { useSavedRecipes } from '../hooks/useSavedRecipes';

export function FinishScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { save, isSaved } = useSavedRecipes();
  const saved = isSaved(slug ?? '');

  return (
    <SafeAreaView style={s.root}>
      {/* Top row */}
      <View style={s.top}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={s.close}>✕</Text>
        </TouchableOpacity>
        <View style={s.fullBar} />
        <Text style={s.done}>Done</Text>
      </View>
      {/* Ring */}
      <View style={s.body}>
        <View style={s.ring}>
          <Text style={s.check}>✓</Text>
        </View>
        <Text style={s.wellMade}>Well made.</Text>
        <Text style={s.sub}>You completed the recipe.</Text>
      </View>
      {/* Save card */}
      <View style={s.saveCard}>
        <Text style={s.saveHeader}>Save for later?</Text>
        <Text style={s.saveSub}>Available offline — no internet needed next time.</Text>
        {!saved ? (
          <CTA label="Save Recipe" onPress={() => save(slug ?? '')} />
        ) : (
          <Text style={s.savedMsg}>✓ Already saved</Text>
        )}
        <GhostButton label="Not now" onPress={() => router.push('/')} />
      </View>
      <Text style={s.shelf}>Shelf life: 4h · refrigerate</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cmBg, padding: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  close: { fontSize: 16, color: colors.cmMuted, marginRight: spacing.md },
  fullBar: { flex: 1, height: 2, backgroundColor: colors.cmGreen, borderRadius: 2 },
  done: { fontSize: 11, fontFamily: fonts.mono, color: colors.cmGreen, marginLeft: spacing.md },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: colors.cmGreen,
    backgroundColor: colors.cmGreenDim,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  check: { fontSize: 28, color: colors.cmGreen },
  wellMade: { fontSize: 25, fontFamily: fonts.serif, fontWeight: '700', color: colors.cmText, marginBottom: 6 },
  sub: { fontSize: 13, fontFamily: fonts.sans, color: colors.cmMuted },
  saveCard: {
    backgroundColor: colors.cmSurf, borderRadius: 14,
    padding: spacing.lg, gap: 10, marginBottom: spacing.md,
  },
  saveHeader: { fontSize: 15, fontFamily: fonts.serif, fontWeight: '700', color: colors.cmGreen },
  saveSub: { fontSize: 12, fontFamily: fonts.sans, color: colors.cmMuted, lineHeight: 17 },
  savedMsg: { fontSize: 13, fontFamily: fonts.sans, color: colors.cmGreen, textAlign: 'center' },
  shelf: { fontSize: 8.5, fontFamily: fonts.mono, color: colors.cmMuted, textAlign: 'center' },
});
```

- [ ] **Step 5: Write `SavedScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { OfflineBadge } from '../components/shared/OfflineBadge';
import { RecipeCard } from '../components/shared/RecipeCard';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { get } from '../offline/storage';
import type { RecipeListItem } from '../api/recipes';

export function SavedScreen() {
  const router = useRouter();
  const { ids } = useSavedRecipes();
  const recipes = ids
    .map(id => get<RecipeListItem>(`saved:${id}`))
    .filter(Boolean) as RecipeListItem[];

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Saved</Text>
        <OfflineBadge />
      </View>
      <FlatList
        data={recipes}
        keyExtractor={r => r.slug}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={s.col}>
            <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.slug}`)} />
          </View>
        )}
        contentContainerStyle={s.grid}
        ListEmptyComponent={
          <Text style={s.empty}>No saved recipes yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { flex: 1, fontSize: 18, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  grid: { padding: spacing.md },
  col: { flex: 1, margin: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
```

- [ ] **Step 6: Wire routes**

`app/finish/[slug].tsx`:
```tsx
import { FinishScreen } from '../../src/screens/FinishScreen';
export default FinishScreen;
```

`app/(tabs)/saved.tsx`:
```tsx
import { SavedScreen } from '../../src/screens/SavedScreen';
export default SavedScreen;
```

- [ ] **Step 7: Commit**

```bash
git add vajeeva/apps/frontend/src/
git commit -m "feat: FinishScreen, SavedScreen, offline MMKV storage, useSavedRecipes"
```

---

### Task 11: SourceGlossaryScreen + auth stubs

**Files:**
- Create: `src/screens/SourceGlossaryScreen.tsx`
- Create: `app/auth/login.tsx` (stub)
- Create: `app/auth/signup.tsx` (stub)
- Create: `app/auth/onboarding.tsx` (stub)
- Modify: `app/source/[slug].tsx`

- [ ] **Step 1: Write `SourceGlossaryScreen.tsx`**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, spacing } from '../theme/tokens';
import { IconButton } from '../components/shared/IconButton';

// ponytail: placeholder data; replace with sourcesApi.get(slug)
const PLACEHOLDER = {
  eyebrow: 'Classical text · ~16th century CE',
  title: 'Samayamulu',
  subtitle: 'Culinary treatise on seasonal foods and medicinal preparations',
  blocks: [
    { label: 'OVERVIEW', text: 'A Telugu culinary text documenting seasonal recipes and their therapeutic applications.' },
    { label: 'CHAPTER REFERENCE', text: 'Referenced in Chapter 4, verse 12–18 for bitter preparations.' },
  ],
  alsoIn: ['Paavakkai Pitla', 'Methi Rasam'],
};

export function SourceGlossaryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const src = PLACEHOLDER;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.nav}>
        <IconButton icon="←" onPress={() => router.back()} />
        <Text style={s.navRight}>SOURCE</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.eyebrow}>{src.eyebrow}</Text>
        <Text style={s.title}>{src.title}</Text>
        <Text style={s.subtitle}>{src.subtitle}</Text>
        {src.blocks.map(b => (
          <View key={b.label} style={s.block}>
            <Text style={s.blockLabel}>{b.label}</Text>
            <Text style={s.blockText}>{b.text}</Text>
          </View>
        ))}
        <View style={s.block}>
          <Text style={s.blockLabel}>ALSO CITED IN</Text>
          {src.alsoIn.map(r => (
            <Text key={r} style={s.cited}>{r}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  nav: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  navRight: { flex: 1, textAlign: 'right', fontSize: 9, fontFamily: fonts.mono, color: colors.muted },
  body: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  eyebrow: { fontSize: 8.5, fontFamily: fonts.sans, fontWeight: '700', color: colors.amber, letterSpacing: 0.08, marginBottom: 6 },
  title: { fontSize: 19, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.ink2, marginBottom: spacing.xl },
  block: { marginBottom: spacing.lg },
  blockLabel: { fontSize: 9, fontFamily: fonts.mono, color: colors.ink, opacity: 0.3, marginBottom: 6, letterSpacing: 0.1 },
  blockText: { fontSize: 11, fontFamily: fonts.sans, color: colors.ink, lineHeight: 16 },
  cited: { fontSize: 11, fontFamily: fonts.serifItalic, color: colors.amber, marginBottom: 3 },
});
```

- [ ] **Step 2: Wire source route**

`app/source/[slug].tsx`:
```tsx
import { SourceGlossaryScreen } from '../../src/screens/SourceGlossaryScreen';
export default SourceGlossaryScreen;
```

- [ ] **Step 3: Auth stubs** (keep API auth logic; just stub the screens for now)

`app/auth/login.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function LoginScreen() { return <View><Text>Login</Text></View>; }
```

`app/auth/signup.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function SignupScreen() { return <View><Text>Sign up</Text></View>; }
```

`app/auth/onboarding.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function OnboardingScreen() { return <View><Text>Onboarding</Text></View>; }
```

- [ ] **Step 4: Commit**

```bash
git add vajeeva/apps/frontend/
git commit -m "feat: SourceGlossaryScreen + auth screen stubs"
```

---

### Task 12: Final integration — run all tests, verify prototypes match

**Files:**
- Modify: existing test files to reflect renamed paths (`apps/frontend` instead of `apps/mobile`)

- [ ] **Step 1: Update any test imports that reference `apps/mobile`**

```bash
grep -r "apps/mobile" vajeeva/ --include="*.ts" --include="*.tsx" -l
```

For each file found, update path to `apps/frontend`.

- [ ] **Step 2: Run admin tests (must stay green)**

```bash
cd vajeeva/apps/admin
npm test -- --passWithNoTests
```

Expected: 17/17 pass.

- [ ] **Step 3: Run frontend type check**

```bash
cd vajeeva/apps/frontend
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Run on web and resize to verify breakpoint**

```bash
cd vajeeva/apps/frontend
npx expo start --web
```

Resize browser window through 768px:
- < 768px: TabBar at bottom, no sidebar
- ≥ 768px: Sidebar at left, no tab bar

- [ ] **Step 5: Final commit**

```bash
git add vajeeva/
git commit -m "feat: Vajeeva frontend UI complete — pixel-perfect mobile + desktop, Expo Router"
```
