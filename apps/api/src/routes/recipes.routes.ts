import { Router } from 'express';
import { Recipe } from '../models/Recipe';

export const recipesRouter = Router();

recipesRouter.get('/', async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    const recipes = await Recipe.find(filter).lean();
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
