/**
 * Atlas Search index definition for the `recipes` collection — shared,
 * side-effect-free config used by both:
 *  - scripts/create-search-index.ts (creates/reports the index on Atlas)
 *  - routes/recipes.routes.ts (references the index by name in $search)
 *
 * Kept separate from the script so importing the route module never triggers
 * the script's mongoose.connect()/process.exit() side effects.
 */

export const SEARCH_INDEX_NAME = 'recipes_search';

// Diacritic- and case-folding analyzer (e.g. "Āhāra" / "ahara" match) per the
// design brief's "forgiving of spelling/diacritics" requirement. Applied to
// every free-text field below so name/ingredient search behaves consistently.
const ANALYZER_NAME = 'recipe_diacritic_folding';

export const SEARCH_INDEX_DEFINITION = {
  mappings: {
    dynamic: false,
    fields: {
      // string: fuzzy/typo-tolerant full-text match. autocomplete: prefix
      // match for "as you type" results (P12 in docs/User-Flows.md).
      nameEn: [
        { type: 'string', analyzer: ANALYZER_NAME },
        { type: 'autocomplete', analyzer: ANALYZER_NAME },
      ],
      nameTa: { type: 'string', analyzer: ANALYZER_NAME },
      description: { type: 'string', analyzer: ANALYZER_NAME },
      ingredients: {
        type: 'document',
        fields: { nameEn: { type: 'string', analyzer: ANALYZER_NAME } },
      },
      // token = exact-match filter fields (not analyzed) — power the
      // status/category/discovery-tag filter params on the search route.
      status: { type: 'token' },
      category: { type: 'token' },
      type: { type: 'token' },
      meals: { type: 'token' },
      mainIngredients: { type: 'token' },
      methods: { type: 'token' },
      dietTags: { type: 'token' },
      makeAhead: { type: 'boolean' },
      totalTimeMin: { type: 'number' },
      healthFlags: {
        type: 'document',
        fields: {
          condition: { type: 'token' },
          severity: { type: 'token' },
        },
      },
    },
  },
  analyzers: [
    {
      name: ANALYZER_NAME,
      charFilters: [],
      tokenizer: { type: 'standard' },
      tokenFilters: [{ type: 'icuFolding' }],
    },
  ],
};
