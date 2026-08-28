import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Share, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fonts, type Colors } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { ContraCard } from '../components/shared/ContraCard';
import { IngredientTable } from '../components/shared/IngredientTable';
import { StepList } from '../components/shared/StepList';
import { SourcePill } from '../components/shared/SourcePill';
import { CTA } from '../components/shared/CTA';
import { Disclaimer } from '../components/shared/Disclaimer';
import { usePreferences } from '../hooks/usePreferences';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { SectionLabel } from '../components/shared/SectionLabel';
import { IconButton } from '../components/shared/IconButton';
import { IconBack, IconHeart, IconHeartFilled, IconShare, IconPlay, IllHero } from '../components/shared/icons';
import { AromaticPowderSheet } from '../components/shared/AromaticPowderSheet';
import { ImageCarousel } from '../components/shared/ImageCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { recipesApi, sortImages, cloudThumb, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeImage, RecipeListItem } from '../api/recipes';
import { getRecipe } from '../offline/catalog';
import { recordRecentlyViewed } from '../hooks/useRecentlyViewed';
import { scaledSheet, sc } from '../theme/scale';

// Matches the API's Source slug scheme (lowercase, non-alphanumeric -> '-').
function toSourceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Public web origin for shareable recipe links (the Expo web export — see the
// `build` script — once it's deployed there). EXPO_PUBLIC_WEB_URL overrides
// per environment (e.g. a staging domain); same override pattern as
// EXPO_PUBLIC_API_URL in api.ts. Until that export is actually deployed at
// this domain, shared links will 404.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://vajeeva.app';

interface DetailView {
  nameEn: string;
  nameTa?: string;
  images: RecipeImage[];
  sources: string[];
  yield: string;
  shelfLife: string;
  contraConditions: string[];
  ingredients: { name: string; amountG: number; amountCup?: string }[];
  steps: { phase?: string; text: string }[];
}

function toDetailView(doc: RecipeDoc): DetailView {
  return {
    nameEn: doc.nameEn,
    nameTa: doc.nameTa,
    // hero-sized Cloudinary transform (390pt-wide hero @3x)
    images: sortImages(doc.images).map(im => ({ ...im, url: cloudThumb(im.url, 1200, 530) })),
    sources: (doc.sources ?? []).map(src => src.text),
    yield: doc.yieldStr ?? '',
    shelfLife: doc.shelfLife ?? '',
    contraConditions: (doc.healthFlags ?? [])
      .filter(f => f.severity !== 'safe')
      .map(f => `${f.condition.charAt(0).toUpperCase() + f.condition.slice(1)}${f.note ? ` — ${f.note}` : ''}`),
    ingredients: (doc.ingredients ?? []).map(ing => ({
      name: ing.nameEn,
      amountG: parseInt(ing.quantityG ?? '', 10) || 0,
      amountCup: ing.quantityCup,
    })),
    steps: [...(doc.steps ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(st => ({ phase: st.phase, text: st.text })),
  };
}

export function RecipeDetailScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [unit, setUnit] = useState<'g' | 'cup'>('g');
  const [aromaOpen, setAromaOpen] = useState(false);
  const [recipe, setRecipe] = useState<DetailView | null>(null);
  const [listItem, setListItem] = useState<RecipeListItem | null>(null);
  const { prefs, loading: prefsLoading } = usePreferences();
  const { isSaved, save, unsave } = useSavedRecipes();

  // Seed the g/cup toggle from the saved Units preference once it loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!prefsLoading) setUnit(prefs.units); }, [prefsLoading]);

  useEffect(() => {
    let alive = true;
    if (!slug) return;
    const apply = (doc: RecipeDoc) => {
      setRecipe(toDetailView(doc));
      const item = toListItem(doc);
      setListItem(item);
      recordRecentlyViewed(item); // feeds Home's "Jump back in" rail
    };
    // Catalog first (instant, offline). Fall back to the network only for a slug
    // not yet cached — e.g. a deep link opened before the first sync completes.
    const cached = getRecipe(slug);
    if (cached) apply(cached);
    else recipesApi.detail(slug).then((doc: RecipeDoc) => { if (alive) apply(doc); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  if (!recipe) {
    return (
      <SafeAreaView style={s.root}>
        <ActivityIndicator style={s.loading} color={colors.green} />
      </SafeAreaView>
    );
  }

  const saved = listItem ? isSaved(listItem.slug) : false;
  const onToggleSave = () => {
    if (!listItem) return;
    if (saved) unsave(listItem.slug); else save(listItem);
  };

  const onShare = () => {
    const link = `${WEB_URL}/recipe/${slug}`;
    Share.share({
      title: recipe.nameEn,
      message: Platform.OS === 'ios' ? recipe.nameEn : `${recipe.nameEn} — a Vajeeva recipe\n${link}`,
      ...(Platform.OS === 'ios' ? { url: link } : {}),
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — photo carousel when the recipe has images, illustration otherwise */}
        <View style={s.hero}>
          {recipe.images.length ? (
            <ImageCarousel images={recipe.images} height={sc(172)} />
          ) : (
            <LinearGradient colors={[colors.greenSoft, colors.sand]} style={s.heroFill}>
              <IllHero width={sc(174)} height={sc(130)} />
            </LinearGradient>
          )}
          <View style={s.heroBar}>
            <IconButton icon={<IconBack size={sc(15)} color={colors.ink} />} onPress={() => router.back()} />
            <View style={s.heroActs}>
              <IconButton
                icon={saved
                  ? <IconHeartFilled size={sc(15)} color={colors.clay} />
                  : <IconHeart size={sc(15)} color={colors.clay} />}
                onPress={onToggleSave}
              />
              <IconButton icon={<IconShare size={sc(15)} color={colors.ink} />} onPress={onShare} />
            </View>
          </View>
        </View>
        <View style={s.body}>
          {/* Title */}
          <View>
            <Text style={s.title}>{recipe.nameEn}</Text>
            {recipe.nameTa ? <Text style={s.tamil}>{recipe.nameTa}</Text> : null}
          </View>

          {/* Sources */}
          <View>
            <SectionLabel label="Classical sources" />
            <View style={s.sourceRow}>
              {recipe.sources.map(src => (
                <SourcePill key={src} name={src} onPress={() => router.push(`/source/${toSourceSlug(src)}` as any)} />
              ))}
            </View>
          </View>

          {/* Yield / shelf */}
          <View style={s.badges}>
            {recipe.yield ? <View style={s.badge}><Text style={s.badgeText}>🫙 {recipe.yield}</Text></View> : null}
            {recipe.shelfLife ? <View style={s.badge}><Text style={s.badgeText}>📅 {recipe.shelfLife}</Text></View> : null}
          </View>

          {/* Contra */}
          <ContraCard conditions={recipe.contraConditions} />

          {/* Ingredients */}
          <View>
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
            <View style={s.fnRow}>
              <Text style={s.fnLabel}>* Some recipes reference</Text>
              <TouchableOpacity style={s.fnPill} onPress={() => setAromaOpen(true)}>
                <Text style={s.fnPillText}>Aromatic Powder Blend <Text style={s.fnExt}>↗</Text></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Method */}
          <View>
            <Text style={[s.sectionTitle, s.methodTitle]}>Method</Text>
            <SectionLabel label={`${recipe.steps.length} steps · cook mode`} />
            <StepList steps={recipe.steps} />
          </View>

          {/* CTA */}
          <CTA label="Start Cook" icon={<IconPlay size={sc(15)} color={colors.onGreen} />} onPress={() => router.push(`/cook/${slug}` as any)} />
          <Disclaimer text="Supportive dietary guidance · not a substitute for medical advice" />
        </View>
      </ScrollView>
      <AromaticPowderSheet visible={aromaOpen} onClose={() => setAromaOpen(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  loading: { flex: 1 },
  hero: {
    height: 172,
  },
  heroFill: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBar: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 2,
  },
  heroActs: { flexDirection: 'row', gap: 6 },
  body: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 14, gap: 13 },
  title: { fontSize: 22, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink, letterSpacing: -0.22, lineHeight: 25 },
  tamil: { fontSize: 13, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber, marginTop: 3 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge: { backgroundColor: colors.sand, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontFamily: fonts.sans, color: colors.ink2 },
  fnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 8, paddingBottom: 11,
  },
  fnLabel: { fontSize: 9, fontFamily: fonts.sans, color: colors.labelFaint },
  fnPill: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(198,144,47,0.45)',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2,
  },
  fnPillText: { fontSize: 9, fontFamily: fonts.serifItalic, fontStyle: 'italic', color: colors.amber },
  fnExt: { fontSize: 8, opacity: 0.7, fontStyle: 'normal', fontFamily: fonts.sans },
  ingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.serif, fontWeight: '700', color: colors.ink },
  methodTitle: { marginBottom: 2 },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.sand, borderRadius: 6, padding: 2, gap: 2,
  },
  toggleBtn: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 4 },
  toggleActive: { backgroundColor: colors.green },
  toggleLabel: { fontSize: 9, fontFamily: fonts.sans, fontWeight: '700', letterSpacing: 0.36, color: colors.muted },
  toggleLabelActive: { color: '#fff' },
});
