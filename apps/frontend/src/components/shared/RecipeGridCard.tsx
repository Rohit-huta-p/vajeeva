import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { fonts, shadows, type Colors } from '../../theme/tokens';
import { useTheme, useThemedStyles } from '../../theme/ThemeContext';
import { FitBadge } from './FitBadge';
import { CategoryIll, categoryTint, IconClock, IconBookmark, IconBookmarkFilled, IconList, IconJar, VegMark } from './icons';
import { imageSource } from '../../offline/images';
import { isNonVeg } from '../../api/recipes';
import type { RecipeListItem } from '../../api/recipes';
import { FEATURES } from '../../config/features';
import { scaledSheet, sc } from '../../theme/scale';

/**
 * Vertical recipe card for the responsive grid. Tile carries a veg/non-veg mark
 * (top-left), a severity/fit pill (top-right, feature-flagged) and a save
 * bookmark (bottom-left); name / Tamil / meta (cook time · steps · yield) sit
 * below. Illustration is sized from the measured tile width so it stays
 * proportional at 2, 3 or 4 columns.
 */
export function RecipeGridCard({ recipe, onPress, saved, onToggleSave }: {
  recipe: RecipeListItem;
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const [tileW, setTileW] = useState(0);
  const showFit = FEATURES.fitBadge && recipe.fit != null;
  const time = recipe.cookTimeMin > 0 ? `${recipe.cookTimeMin} min` : 'No-cook';

  return (
    <TouchableOpacity style={[s.card, saved && s.cardSaved]} onPress={onPress} activeOpacity={0.92}>
      {/* Persistent "saved" cue: soft-green fill (s.cardSaved) + a green bar down
          the left edge, so saved cards are spottable while scrolling. */}
      {saved ? <View style={s.savedBar} pointerEvents="none" /> : null}
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

        {/* Very light dark tint over the photo so the overlaid marks/pills
            (esp. the amber Caution pill) read against bright images. */}
        {recipe.imageUrl ? <View style={s.tint} pointerEvents="none" /> : null}

        {/* Veg / non-veg mark — top-left */}
        <View style={s.tl}><VegMark nonVeg={isNonVeg(recipe)} size={sc(15)} /></View>

        {/* Severity / fit pill — top-right; plug-and-play (hidden when the
            feature is off or the recipe has no health data). */}
        {showFit && (
          <View style={s.tr}><FitBadge level={recipe.fit!} /></View>
        )}
      </View>

      {/* Name row — the save bookmark sits to the right of the title. Name
          always reserves 2 lines (long titles truncate with "…"); Tamil always
          reserves its line even when absent — so every card is the same height
          regardless of how long the name is or whether a Tamil name exists. */}
      <View style={s.nameRow}>
        <Text style={s.name} numberOfLines={2} ellipsizeMode="tail">{recipe.nameEn}</Text>
        {onToggleSave && (
          <TouchableOpacity
            style={s.saveBtn}
            onPress={onToggleSave}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${recipe.nameEn} from saved` : `Save ${recipe.nameEn}`}
          >
            {saved
              ? <IconBookmarkFilled size={sc(16)} color={colors.ink2} />
              : <IconBookmark size={sc(16)} color={colors.ink2} />}
          </TouchableOpacity>
        )}
      </View>
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
  // Saved state — soft green fill + a green left-edge bar (rounded to hug the
  // card's left corners).
  cardSaved: { backgroundColor: colors.sand },
  savedBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
    backgroundColor: colors.ink2,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
  },
  // aspectRatio (not in the scaled prop set) keeps the tile proportional at
  // every column width; overflow clips the cover image to the rounded corners.
  tile: {
    borderRadius: 9, aspectRatio: 5 / 4,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  tileImg: { width: '100%', height: '100%' },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' },
  tl: { position: 'absolute', top: 6, left: 6 },
  tr: { position: 'absolute', top: 6, right: 6 },
  // Name row: the title (2-line reserved) with the save bookmark to its right.
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 7 },
  saveBtn: { marginLeft: 6 },
  // minHeight = 2 × lineHeight reserves two lines for every name, so a 1-line
  // name occupies the same vertical space as a 2-line one.
  name: { flex: 1, fontSize: 13, lineHeight: 15.5, minHeight: 31, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  tamil: { fontSize: 10, lineHeight: 14, minHeight: 14, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 1 },
  // Single row (no wrap): steps stays fixed, the yield item shrinks + ellipsizes.
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaGrow: { flexShrink: 1, minWidth: 0 },
  metaText: { fontSize: 9, fontFamily: fonts.sans, color: colors.ink2, flexShrink: 1 },
  metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: colors.line2, marginHorizontal: 6 },
});
