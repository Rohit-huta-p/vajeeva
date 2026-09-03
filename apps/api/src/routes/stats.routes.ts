import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { User } from '../models/User';
import { SavedRecipe } from '../models/SavedRecipe';
import { CookLog } from '../models/CookLog';
import { Recipe } from '../models/Recipe';

export const statsAdminRouter = Router();
statsAdminRouter.use(requireAuth, requireAdmin);

const DAY = 86_400_000;
const WEEKS = 8;

// GET /api/admin/stats — engagement metrics for the admin dashboard.
// Computed in JS over the (small) corpus; move to aggregation if it grows.
// See docs/specs/2026-09-03-admin-outcomes.md (Phase 2).
statsAdminRouter.get('/', async (_req, res, next) => {
  try {
    const now = Date.now();

    // Users (patients only — admins aren't patients).
    const users = await User.find({ role: { $ne: 'admin' } }, 'lastSyncAt').lean();
    const activeWithin = (days: number) =>
      users.filter(u => u.lastSyncAt && new Date(u.lastSyncAt).getTime() > now - days * DAY).length;

    // Saves + makes (both small; fetch the pairs once).
    const savedPairs = await SavedRecipe.find({}, 'userId recipeId').lean();
    const cooks = await CookLog.find({}, 'userId recipeId madeAt rating').lean();

    // Saved-but-never-made friction — a save with zero makes of the same recipe.
    const cookedPairs = new Set(cooks.map(c => `${c.userId}:${c.recipeId}`));
    const savedNotMade = savedPairs.filter(s => !cookedPairs.has(`${s.userId}:${s.recipeId}`)).length;

    // Average rating (satisfaction).
    const rated = cooks.filter(c => typeof c.rating === 'number');
    const avgRating = rated.length
      ? Math.round((rated.reduce((a, c) => a + (c.rating as number), 0) / rated.length) * 10) / 10
      : null;

    // Makes by week — last 8 weeks, oldest → newest.
    const makesByWeek = Array.from({ length: WEEKS }, (_, i) => {
      const weeksAgo = WEEKS - 1 - i;
      const start = new Date(now - weeksAgo * 7 * DAY);
      start.setHours(0, 0, 0, 0);
      return { week: start.toISOString().slice(0, 10), count: 0 };
    });
    for (const c of cooks) {
      const wa = Math.floor((now - new Date(c.madeAt).getTime()) / (7 * DAY));
      if (wa >= 0 && wa < WEEKS) makesByWeek[WEEKS - 1 - wa].count++;
    }

    // Most-cooked recipes (top 5).
    const byRecipe = new Map<string, number>();
    for (const c of cooks) {
      const id = String(c.recipeId);
      byRecipe.set(id, (byRecipe.get(id) ?? 0) + 1);
    }
    const top = [...byRecipe.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const recipes = await Recipe.find({ _id: { $in: top.map(([id]) => id) } }, 'slug nameEn').lean();
    const byId = new Map(recipes.map(r => [String(r._id), r]));
    const mostCooked = top.map(([id, makes]) => ({
      slug: byId.get(id)?.slug ?? '',
      nameEn: byId.get(id)?.nameEn ?? '(deleted recipe)',
      makes,
    }));

    res.json({
      users: { total: users.length, active7d: activeWithin(7), active30d: activeWithin(30) },
      saves: savedPairs.length,
      makes: cooks.length,
      savedNotMade,
      avgRating,
      makesByWeek,
      mostCooked,
    });
  } catch (err) { next(err); }
});
