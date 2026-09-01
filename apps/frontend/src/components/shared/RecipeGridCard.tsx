import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { FitBadge } from './FitBadge';
import { CategoryIll, categoryTint, IconClock, IconHeart, IconHeartFilled, IconList, IconJar, VegMark } from './icons';
import { imageSource } from '../../offline/images';
import { isNonVeg } from '../../api/recipes';
import type { RecipeListItem } from '../../api/recipes';
import { FEATURES } from '../../config/features';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * Vertical recipe card for the responsive grid. Tile carries a fit badge
 * (top-left, feature-flagged) and a save toggle (top-right); name / Tamil /
 * meta (cook time · steps · yield) sit below. Illustration is sized from the
 * measured tile width so it stays proportional at 2, 3 or 4 columns.
 */
export function RecipeGridCard({ recipe, onPress, saved, onToggleSave }: {
  recipe: RecipeListItem;
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const { colors, scheme } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [tileW, setTileW] = useState(0);
  const showFit = FEATURES.fitBadge && recipe.fit != null;
  const time = recipe.cookTimeMin > 0 ? `${recipe.cookTimeMin} min` : 'No-cook';
  // Floating controls sit on the tile (photo or tint): use a light scrim in the
  // light theme, a dark scrim in the dark theme, so the ink2 icon (which flips
  // with the theme) always contrasts.
  const scrim = scheme === 'dark' ? 'rgba(18,15,11,0.55)' : 'rgba(251,248,241,0.92)';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.92}>
      <View
        style={[s.tile, { backgroundColor: categoryTint(recipe.category) }]}
        onLayout={e => setTileW(e.nativeEvent.layout.width)}
      >
        {recipe.imageUrl ? (
          <Image
            source={imageSource(recipe.slug, recipe.imageUrl, 500, 400)}
            accessibilityLabel={recipe.nameEn}
            style={s.tileImg}
            resizeMode="cover"
          />
        ) : tileW > 0 ? (
          <CategoryIll category={recipe.category} size={Math.round(tileW * 0.55)} />
        ) : null}

        {/* Veg / non-veg mark — top-left */}
        <View style={s.tl}><VegMark nonVeg={isNonVeg(recipe)} size={sc(15)} /></View>

        {/* Fit badge — bottom-left; plug-and-play (hidden when the feature is
            off or the recipe has no health data). */}
        {showFit && (
          <View style={s.bl}><FitBadge level={recipe.fit!} /></View>
        )}

        {/* Save toggle — nested Touchable takes the press, so the card's onPress
            doesn't also fire. Rendered only when a handler is wired. */}
        {onToggleSave && (
          <TouchableOpacity
            style={[s.save, { backgroundColor: scrim }]}
            onPress={onToggleSave}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${recipe.nameEn} from saved` : `Save ${recipe.nameEn}`}
          >
            {saved
              ? <IconHeartFilled size={sc(13)} color={colors.clay} />
              : <IconHeart size={sc(13)} color={colors.ink2} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Name always reserves 2 lines (long titles truncate with "…"); Tamil
          always reserves its line even when absent — so every card is the same
          height regardless of how long the name is or whether a Tamil name
          exists. */}
      <Text style={s.name} numberOfLines={2} ellipsizeMode="tail">{recipe.nameEn}</Text>
      <Text style={s.tamil} numberOfLines={1}>{recipe.nameTa || ' '}</Text>

      {/* Meta row — single line so card heights stay uniform: cook time (always),
          then steps and yield when present; a long yield truncates with "…". */}
      <View style={s.meta}>
        <View style={s.metaItem}>
          <IconClock size={sc(10)} color={colors.muted} />
          <Text style={s.metaText}>{time}</Text>
        </View>
        {recipe.stepCount > 0 && <View style={s.metaDot} />}
        {recipe.stepCount > 0 && (
          <View style={s.metaItem}>
            <IconList size={sc(10)} color={colors.muted} />
            <Text style={s.metaText}>{recipe.stepCount} step{recipe.stepCount === 1 ? '' : 's'}</Text>
          </View>
        )}
        {recipe.yieldStr ? <View style={s.metaDot} /> : null}
        {recipe.yieldStr ? (
          <View style={[s.metaItem, s.metaGrow]}>
            <IconJar size={sc(10)} color={colors.muted} />
            <Text style={s.metaText} numberOfLines={1}>{recipe.yieldStr}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  card: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    borderRadius: 13, padding: 7,
    ...shadows.card,
  },
  // aspectRatio (not in the scaled prop set) keeps the tile proportional at
  // every column width; overflow clips the cover image to the rounded corners.
  tile: {
    borderRadius: 9, aspectRatio: 5 / 4,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  tileImg: { width: '100%', height: '100%' },
  tl: { position: 'absolute', top: 6, left: 6 },
  bl: { position: 'absolute', bottom: 6, left: 6 },
  // backgroundColor (a theme-aware scrim) is applied inline.
  save: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  // minHeight = 2 × lineHeight reserves two lines for every name, so a 1-line
  // name occupies the same vertical space as a 2-line one.
  name: { fontSize: 13, lineHeight: 15.5, minHeight: 31, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, marginTop: 7 },
  tamil: { fontSize: 10, lineHeight: 14, minHeight: 14, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 1 },
  // Single row (no wrap): steps stays fixed, the yield item shrinks + ellipsizes.
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaGrow: { flexShrink: 1, minWidth: 0 },
  metaText: { fontSize: 9, fontFamily: fonts.sans, color: colors.ink2, flexShrink: 1 },
  metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: colors.line2, marginHorizontal: 6 },
});
