import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Recipe } from '../models/Recipe';
import { SavedRecipe } from '../models/SavedRecipe';

export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.get('/recipes', async (req, res, next) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const recipes = await Recipe.find({ status: 'published', updatedAt: { $gt: since } }).lean();
    res.json(recipes);
  } catch (err) { next(err); }
});

syncRouter.get('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const saved = await SavedRecipe.find({ userId }).lean();
    res.json(saved.map(s => s.recipeId.toString()));
  } catch (err) { next(err); }
});

syncRouter.post('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { added = [], removed = [] } = req.body as { added: string[]; removed: string[] };
    const addOps = added.map(recipeId =>
      SavedRecipe.findOneAndUpdate(
        { userId, recipeId },
        { userId, recipeId, savedAt: new Date() },
        { upsert: true, new: true }
      )
    );
    const removeOp = SavedRecipe.deleteMany({ userId, recipeId: { $in: removed } });
    await Promise.all([...addOps, removeOp]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
