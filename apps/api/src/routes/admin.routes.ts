import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { Recipe } from '../models/Recipe';
import { RecipeInputSchema } from '@vajeeva/shared';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/recipes', async (req, res, next) => {
  try {
    res.json(await Recipe.find({}).lean());
  } catch (err) { next(err); }
});

adminRouter.post('/recipes', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const existing = await Recipe.findOne({ slug: parsed.data.slug });
    if (existing) { res.status(409).json({ error: 'Slug already exists' }); return; }
    const recipe = await Recipe.create(parsed.data);
    res.status(201).json(recipe);
  } catch (err) { next(err); }
});

adminRouter.put('/recipes/:id', async (req, res, next) => {
  try {
    const parsed = RecipeInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...parsed.data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.patch('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(recipe);
  } catch (err) { next(err); }
});

adminRouter.delete('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ ok: true });
  } catch (err) { next(err); }
});
