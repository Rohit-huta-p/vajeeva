import { Router } from 'express';
import { Recipe } from '../models/Recipe';
import { SEARCH_INDEX_NAME } from '../search/recipesSearchIndex';

export const recipesRouter = Router();

recipesRouter.get('/', async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    const recipes = await Recipe.find(filter).lean();
    res.json(recipes);
  } catch (err) { next(err); }
});

// Free-text search across name (EN + Tamil/Sanskrit), ingredients and
// description, backed by the Atlas Search index created by
// `npm run search:create-index` (see scripts/create-search-index.ts for the
// index definition — fuzzy + diacritic-folded, so misspellings and missing
// diacritics still match). Registered before '/:slug' so 'search' isn't
// swallowed as a slug. `q` is required; an empty/missing query returns []
// without touching $search (keeps that no-op path testable without a real
// Atlas cluster — see __tests__/recipes.test.ts).
//
// Optional equality filters narrow results within the same query:
// category, diet (dietTags), method (methods), makeAhead ('true').
recipesRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q ?? '').trim();
    if (!q) { res.json([]); return; }

    const filter: Record<string, unknown>[] = [{ equals: { path: 'status', value: 'published' } }];
    if (req.query.category) filter.push({ equals: { path: 'category', value: String(req.query.category) } });
    if (req.query.diet) filter.push({ equals: { path: 'dietTags', value: String(req.query.diet) } });
    if (req.query.method) filter.push({ equals: { path: 'methods', value: String(req.query.method) } });
    if (req.query.makeAhead === 'true') filter.push({ equals: { path: 'makeAhead', value: true } });

    const recipes = await Recipe.aggregate([
      {
        $search: {
          index: SEARCH_INDEX_NAME,
          compound: {
            filter,
            should: [
              { autocomplete: { query: q, path: 'nameEn', score: { boost: { value: 5 } } } },
              { text: { query: q, path: 'nameEn', fuzzy: { maxEdits: 1, prefixLength: 2 }, score: { boost: { value: 4 } } } },
              { text: { query: q, path: 'nameTa', fuzzy: { maxEdits: 1 }, score: { boost: { value: 3 } } } },
              { text: { query: q, path: 'ingredients.nameEn', fuzzy: { maxEdits: 1 }, score: { boost: { value: 2 } } } },
              { text: { query: q, path: 'description' } },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      { $limit: 20 },
      { $set: { score: { $meta: 'searchScore' } } },
    ]);
    res.json(recipes);
  } catch (err) { next(err); }
});

recipesRouter.get('/:slug', async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});
