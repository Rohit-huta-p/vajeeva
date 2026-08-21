import { Router } from 'express';
import mongoose from 'mongoose';
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
    const ids = saved.map(s => s.recipeId.toString());

    // ?format=map → { [id]: true } for efficient frontend lookup
    if (req.query.format === 'map') {
      const map: Record<string, boolean> = {};
      for (const id of ids) map[id] = true;
      res.json(map);
    } else {
      res.json(ids);
    }
  } catch (err) { next(err); }
});

/** Resolve a slug-or-ObjectId string to an ObjectId string.
 *  Returns null if the slug is unknown or if the id is invalid. */
async function resolveRecipeId(slugOrId: string): Promise<string | null> {
  if (mongoose.Types.ObjectId.isValid(slugOrId) && slugOrId.length === 24) {
    return slugOrId; // already an ObjectId
  }
  // treat as slug
  const recipe = await Recipe.findOne({ slug: slugOrId }).select('_id').lean();
  return recipe ? recipe._id.toString() : null;
}

syncRouter.post('/saved', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { added = [], removed = [] } = req.body as { added: string[]; removed: string[] };

    // Resolve slugs → ObjectIds (skip unknowns)
    const resolvedAdded = (await Promise.all(added.map(resolveRecipeId))).filter(Boolean) as string[];
    const resolvedRemoved = (await Promise.all(removed.map(resolveRecipeId))).filter(Boolean) as string[];

    const addOps = resolvedAdded.map(recipeId =>
      SavedRecipe.findOneAndUpdate(
        { userId, recipeId },
        { userId, recipeId, savedAt: new Date() },
        { upsert: true, new: true }
      )
    );
    const removeOp = SavedRecipe.deleteMany({ userId, recipeId: { $in: resolvedRemoved } });
    await Promise.all([...addOps, removeOp]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});
