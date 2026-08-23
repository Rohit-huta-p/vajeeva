import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, shadows } from '../../theme/tokens';
import { CategoryIll, categoryTint } from './icons';
import { cloudThumb } from '../../api/recipes';
import type { RecipeListItem } from '../../api/recipes';
import { scaledSheet, sc } from '../../theme/scale';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const texLabel = (c: string) => (c.startsWith('semi') ? 'Semi-solid' : cap(c));

export interface CookLead {
  recipe: RecipeListItem;
  currentStep: number;
  totalSteps: number;
}

/**
 * "Jump back in" as one horizontal strip. The active cook leads as a green tile
 * — kept green (the ContinueCookingCard treatment), since resuming is the
 * highest-value action — and recently-viewed follow as image-overlay cards
 * (name on a scrim; the recipe photo when it has one, else the category
 * illustration). The in-progress recipe is de-duped out of the recents.
 */
export function PickUpRail({ cook, recent, onResume, onOpenRecent }: {
  cook: CookLead | null;
  recent: RecipeListItem[];
  onResume: () => void;
  onOpenRecent: (slug: string) => void;
}) {
  const list = cook ? recent.filter(r => r.slug !== cook.recipe.slug) : recent;
  const pct = cook && cook.totalSteps > 0
    ? Math.max(6, Math.min(100, Math.round((cook.currentStep / cook.totalSteps) * 100)))
    : 0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rail} contentContainerStyle={s.content}>
      {cook ? (
        <TouchableOpacity style={s.cook} onPress={onResume} activeOpacity={0.9}>
          <View style={s.cookTile}>
            <View style={s.cookBadge}><Text style={s.cookBadgeText}>Cooking</Text></View>
            {cook.recipe.imageUrl ? (
              <Image source={{ uri: cloudThumb(cook.recipe.imageUrl, 200, 120) }} style={s.fill} resizeMode="cover" />
            ) : (
              <CategoryIll category={cook.recipe.category} size={sc(36)} />
            )}
          </View>
          <Text style={s.cookName} numberOfLines={1}>{cook.recipe.nameEn}</Text>
          <Text style={s.cookStep}>Step {cook.currentStep} of {cook.totalSteps}</Text>
          <View style={s.cookBar}><View style={[s.cookBarFill, { width: `${pct}%` }]} /></View>
        </TouchableOpacity>
      ) : null}

      {list.map(r => (
        <TouchableOpacity key={r.slug} style={s.rv} onPress={() => onOpenRecent(r.slug)} activeOpacity={0.9}>
          <View style={[s.rvTile, { backgroundColor: categoryTint(r.category) }]}>
            {r.imageUrl ? (
              <Image source={{ uri: cloudThumb(r.imageUrl, 260, 240) }} style={s.fill} resizeMode="cover" />
            ) : (
              <CategoryIll category={r.category} size={sc(50)} />
            )}
            <LinearGradient colors={['transparent', 'rgba(28,24,18,0.74)']} style={s.rvGrad} pointerEvents="none" />
            <Text style={s.rvName} numberOfLines={2}>{r.nameEn}</Text>
          </View>
          <Text style={s.rvMeta}>{texLabel(r.category)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = scaledSheet({
  rail: { flexGrow: 0, marginHorizontal: -14 },
  content: { gap: 9, paddingHorizontal: 14, paddingBottom: 2, alignItems: 'flex-start' },

  // Green cook lead — same green + onGreen treatment as ContinueCookingCard.
  cook: {
    width: 112, backgroundColor: colors.green, borderRadius: 13, padding: 8,
    ...shadows.card,
  },
  cookTile: {
    height: 46, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cookBadge: {
    position: 'absolute', top: 4, left: 4, zIndex: 2,
    backgroundColor: colors.onGreen, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1,
  },
  cookBadgeText: {
    fontFamily: fonts.mono, fontSize: 6.5, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', color: colors.green,
  },
  cookName: { fontFamily: fonts.serif, fontSize: 11, fontWeight: '700', color: colors.onGreen, marginTop: 7 },
  cookStep: { fontFamily: fonts.sans, fontSize: 8.5, color: colors.onGreen, opacity: 0.85, marginTop: 2 },
  cookBar: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: 6, overflow: 'hidden' },
  cookBarFill: { height: 3, backgroundColor: colors.onGreen, borderRadius: 2 },

  // Recent · image-overlay (name on a scrim, photo-ready).
  rv: { width: 90 },
  rvTile: {
    width: 90, height: 80, borderRadius: 13, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 5,
    ...shadows.card,
  },
  rvGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%' },
  rvName: {
    position: 'absolute', left: 8, right: 8, bottom: 6, zIndex: 2,
    fontFamily: fonts.serif, fontSize: 10, lineHeight: 12, fontWeight: '700', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  rvMeta: { fontFamily: fonts.mono, fontSize: 8, color: colors.muted, marginTop: 4, paddingLeft: 2 },

  // Fills its rounded tile as a background layer, ignoring the tile's padding.
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
});
