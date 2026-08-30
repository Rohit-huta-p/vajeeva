import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, FlatList, ScrollView, Text, TouchableOpacity, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fonts, shadows, type Colors } from '../theme/tokens';
import { useTheme, useThemedStyles } from '../theme/ThemeContext';
import { RecipeGridCard } from '../components/shared/RecipeGridCard';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { SearchBar } from '../components/shared/SearchBar';
import { FilterChip } from '../components/shared/FilterChip';
import { IconBack, IconFilter } from '../components/shared/icons';
import { recipesApi, toListItem } from '../api/recipes';
import type { RecipeDoc, RecipeListItem } from '../api/recipes';
import { getAllRecipes, searchCatalog } from '../offline/catalog';
import { useOffline } from '../offline/OfflineProvider';
import { isFacet, facetLabel, matchFacet, matchTag, type TagAxis } from '../config/facets';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { scaledSheet, sc } from '../theme/scale';

const FILTERS = ['All', 'Solid', 'Liquid', 'Semi-solid'] as const;

// Display label -> API category value; also accepts the texture route param
// (HomeScreen pillar keys: solid | liquid | semi).
const LABEL_TO_CATEGORY: Record<string, string> = {
  Solid: 'solid', Liquid: 'liquid', 'Semi-solid': 'semi-solid',
};
// Per-category subtitle copy, mirroring the Home pillar subs (fidelity spec).
const LABEL_SUB: Record<string, string> = {
  Solid: 'breads · sweets · snacks',
  Liquid: 'drinks · soups · buttermilk',
  'Semi-solid': 'porridge · puddings · chutneys',
};
// Title-case a tag code for the header ('black-gram' → 'Black gram').
const prettyTag = (v: string) => v.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());

function textureToLabel(texture?: string): string {
  if (!texture) return 'All';
  const t = texture.toLowerCase();
  if (t.startsWith('semi')) return 'Semi-solid';
  const label = t.charAt(0).toUpperCase() + t.slice(1);
  return label in LABEL_TO_CATEGORY ? label : 'All';
}

// Responsive column count: 2 on phones, 3 on md, 4 on lg — the desktop
// prototype's recipe-grid (3 cols) / saved-grid (4 cols) breakpoints. Keyed to
// window width (same 768 breakpoint as useIsDesktop / scale.ts DESKTOP_MIN).
function columnsFor(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

// A grid cell is a recipe, a loading skeleton, or an invisible spacer padding
// the last row.
type GridItem =
  | RecipeListItem
  | { skeleton: true; slug: string }
  | { filler: true; slug: string };

// Skeleton rows shown while the first fetch (or a filter change) is in flight.
const SKELETON_ROWS = 3;

export function RecipeListScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cols = columnsFor(width);
  const { isSaved, save, unsave } = useSavedRecipes();
  const { ready, lastSyncedAt, resync } = useOffline();
  const { texture, facet, type, meal, ingredient, method, q } = useLocalSearchParams<{
    texture?: string; facet?: string; type?: string; meal?: string; ingredient?: string; method?: string; q?: string;
  }>();
  // A free-text search (Home SearchBar submit) replaces the texture/facet/tag
  // browse flow entirely for this load — see load() below — rather than
  // composing with it, matching v1 scope (P12 in docs/User-Flows.md).
  const isSearch = !!q?.trim();
  const [filter, setFilter] = useState(textureToLabel(texture));
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  // In-screen search — same SearchBar as Home; submit drives the `q` param
  // (full-catalog search via load()). Kept in sync when arriving with ?q=.
  const [searchText, setSearchText] = useState(q ?? '');
  useEffect(() => { setSearchText(q ?? ''); }, [q]);

  // Round icon button per prototype .icobtn.
  const IcoBtn = ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity style={s.icobtn} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );

  // A `facet` param (Home mood chips) filters within the selected texture, so
  // the texture chips still narrow the results.
  const load = useCallback(async () => {
    try {
      // Offline-first: read from the cached catalog (works with no network);
      // category + facet/tag narrowing run client-side over it. Fall back to the
      // network only before the catalog has populated (first run, pre-sync).
      const cached = getAllRecipes();
      if (isSearch) {
        const docs: RecipeDoc[] = cached.length
          ? searchCatalog(q!.trim())
          : await recipesApi.search(q!.trim());
        setRecipes(docs.map(toListItem));
        return;
      }
      const docs: RecipeDoc[] = cached.length ? cached : await recipesApi.list();
      let items = docs.map(toListItem);
      if (LABEL_TO_CATEGORY[filter]) items = items.filter(r => r.category === LABEL_TO_CATEGORY[filter]);
      if (isFacet(facet)) items = items.filter(r => matchFacet(r, facet));
      // Value-axis tag filters (Home "Cook with…" tiles, deep links) — AND across axes.
      const axes: [TagAxis, string | undefined][] = [['type', type], ['meal', meal], ['ingredient', ingredient], ['method', method]];
      for (const [axis, value] of axes) {
        if (value) items = items.filter(r => matchTag(r, axis, value));
      }
      setRecipes(items);
    } catch { } finally { setLoading(false); }
  }, [filter, facet, type, meal, ingredient, method, isSearch, q]);

  // Show skeletons for the initial load and on every filter/facet change (a new
  // query). Pull-to-refresh keeps the current list and uses the spinner instead.
  useEffect(() => { setLoading(true); load(); }, [load, ready, lastSyncedAt]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    resync();       // best-effort catalog re-pull; the effect reloads on completion
    await load();   // re-render from the current cache immediately
    setRefreshing(false);
  }, [load, resync]);

  const sub = isSearch
    ? `${recipes.length} result${recipes.length === 1 ? '' : 's'}`
    : LABEL_SUB[filter]
      ? `${recipes.length} recipes · ${LABEL_SUB[filter]}`
      : `${recipes.length} recipes`;

  // Pad the last row with invisible spacers so every row has `cols` cells. Without
  // this a lone last-row card skips the column gap and renders wider (→ a taller
  // aspect-ratio tile), breaking uniform card heights.
  const gridData = useMemo<GridItem[]>(() => {
    if (loading) {
      return Array.from({ length: cols * SKELETON_ROWS }, (_, i) => ({ skeleton: true as const, slug: `__skel-${i}` }));
    }
    const rem = recipes.length % cols;
    if (rem === 0) return recipes;
    const fillers: GridItem[] = Array.from({ length: cols - rem }, (_, i) => ({ filler: true, slug: `__filler-${i}` }));
    return [...recipes, ...fillers];
  }, [loading, recipes, cols]);

  return (
    <View style={s.root}>
      <View style={s.page}>
        {/* Header — stays on the bone ground */}
        <View style={s.header}>
          <IcoBtn onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <IconBack size={sc(15)} color={colors.ink} />
          </IcoBtn>
          <View style={s.grow}>
            <Text style={s.title} numberOfLines={1}>{
              isSearch ? `“${q}”`
                : isFacet(facet) ? facetLabel(facet)
                : ingredient ? prettyTag(ingredient)
                : type ? prettyTag(type)
                : meal ? prettyTag(meal)
                : method ? prettyTag(method)
                : (filter === 'All' ? 'All Recipes' : filter)
            }</Text>
            <Text style={s.subtitle}>{sub}</Text>
          </View>
          <IcoBtn>
            <IconFilter size={sc(15)} color={colors.ink} />
          </IcoBtn>
        </View>
        {/* Search — same bar as Home; submit runs a full-catalog search (q param) */}
        <View style={s.searchWrap}>
          <SearchBar
            placeholder="Search recipes…"
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={() => router.setParams({ q: searchText.trim() })}
          />
        </View>
        {/* Filter chips — also on bone, part of the header zone. Hidden for a
            free-text search: chips filter the browse list this screen also
            renders, and don't compose with search results in v1. */}
        {!isSearch && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsContent}>
            {FILTERS.map(f => (
              <FilterChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
            <FilterChip label="🛡 Safe for me" active={false} onPress={() => { }} safeForMe />
          </ScrollView>
        )}
        {/* Recessed well — the grid drops into a sand tray with a rounded lip,
            so the recipes read as content held BELOW the header instead of on
            the same continuous surface. The tray bleeds to the screen bottom
            (drawer feel); the bottom safe-area inset is paid inside the grid. */}
        <View style={s.well}>
          <FlatList
            // key forces a fresh mount when the column count changes — RN does
            // not allow numColumns to change on an existing list.
            key={`grid-${cols}`}
            data={gridData}
            keyExtractor={item => item.slug}
            numColumns={cols}
            columnWrapperStyle={s.gridRow}
            renderItem={({ item }) => (
              <View style={[s.col, { maxWidth: `${100 / cols}%` }]}>
                {'skeleton' in item ? (
                  <SkeletonCard />
                ) : 'filler' in item ? null : (
                  <RecipeGridCard
                    recipe={item}
                    onPress={() => router.push(`/recipe/${item.slug}`)}
                    saved={isSaved(item.slug)}
                    onToggleSave={() => (isSaved(item.slug) ? unsave(item.slug) : save(item))}
                  />
                )}
              </View>
            )}
            style={s.flatList}
            contentContainerStyle={[s.list, { paddingBottom: sc(24) + insets.bottom }, recipes.length === 0 && !loading && s.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
            ListEmptyComponent={!loading ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>
                  {isSearch
                    ? `No recipes match “${q}”. Try a different spelling or ingredient.`
                    : 'No recipes here yet.'}
                </Text>
              </View>
            ) : null}
          />
          {/* RN has no inset shadow, so a short top gradient casts the recess
              onto the top of the scrolling content — the lip of the tray. */}
          <LinearGradient
            colors={['rgba(42,37,30,0.16)', 'rgba(42,37,30,0)']}
            style={s.lip}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => scaledSheet({
  root: { flex: 1, backgroundColor: colors.bone },
  // No horizontal padding on the page: the header and chips carry their own
  // 14pt inset, while the well below bleeds edge-to-edge so the tray spans the
  // full width. Column gap 10 sets the header→chips→tray rhythm.
  page: { flex: 1, paddingTop: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchWrap: { paddingHorizontal: 14 },
  grow: { flex: 1, minWidth: 0 },
  // Explicit lineHeights (prototype .screen line-height 1.4) so the two-line
  // header block is the same height on every platform; left at `normal` the
  // line box is font-metric-derived and leaves no gap between the two lines.
  title: {
    fontSize: 18, lineHeight: 25,
    fontFamily: fonts.serif, fontWeight: '700', letterSpacing: -0.18, color: colors.ink,
  },
  subtitle: { fontSize: 10, lineHeight: 14, fontFamily: fonts.sans, color: colors.ink2 },
  icobtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  // Full-bleed chip row: chips align with the header at 14pt and scroll under
  // the screen edge, with a matching 14pt gutter at the end of the scroll.
  chips: { flexGrow: 0 },
  chipsContent: { gap: 6, paddingHorizontal: 14 },
  // The sand tray. Rounded top lip + a darker fill than bone create the
  // recess; overflow:hidden clips the scrolling cards to the rounded corners.
  well: {
    flex: 1,
    backgroundColor: colors.sand,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  lip: { position: 'absolute', top: 0, left: 0, right: 0, height: 16 },
  // flex:1 bounds the grid to the tray so it scrolls INSIDE the well (header
  // and lip stay put) instead of growing the whole screen.
  flatList: { flex: 1 },
  // Grid spacing: gap between rows (list) and between columns (gridRow) both 10;
  // col gets flex:1 with a per-breakpoint maxWidth (set inline) so a partial
  // last row stays left-aligned at column width instead of stretching.
  list: { gap: 10, paddingTop: 16, paddingHorizontal: 14 },
  // Lets the empty state center in the well instead of pinning to the top.
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  gridRow: { gap: 10 },
  col: { flex: 1 },
  empty: { paddingHorizontal: 30, alignItems: 'center' },
  emptyText: { fontSize: 12.5, lineHeight: 18, fontFamily: fonts.sans, color: colors.ink2, textAlign: 'center' },
});
